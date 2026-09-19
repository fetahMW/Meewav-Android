package com.meewav.android.features.rooms.wave

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.text.Editable
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextWatcher
import android.text.InputType
import android.text.style.ImageSpan
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

internal class WaveEmojiInputController {
    internal var editor: WaveEmojiEditText? = null
    fun insert(name: String) { editor?.insertEmoji(name) }
    fun hideKeyboard() { editor?.let {
        (it.context.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager).hideSoftInputFromWindow(it.windowToken, 0)
        it.clearFocus()
    } }
}

private class MeewavEmojiSpan(val name: String, drawable: android.graphics.drawable.Drawable) :
    ImageSpan(drawable, ALIGN_BOTTOM)

/** One editable character per image: native caret, selection and Samsung IME deletion. */
internal class WaveEmojiEditText(context: Context) : EditText(context) {
    var onDraftChange: (String) -> Unit = {}
    var onSend: () -> Unit = {}
    var onFocused: (Boolean) -> Unit = {}
    private var syncing = false
    private var acceptedDraft = ""
    private val token = Regex("\\[\\[mw:([a-z0-9-]+)\\]\\]")

    init {
        background = null
        setPadding(0, 0, 0, 0)
        setTextColor(Color.rgb(228, 227, 238))
        setHintTextColor(Color.rgb(151, 148, 166))
        highlightColor = 0x557E44E3
        textSize = 13f
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        hint = "Écris un message…"
        contentDescription = "Écrire un message"
        gravity = Gravity.CENTER_VERTICAL
        setSingleLine(true)
        inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
        imeOptions = EditorInfo.IME_ACTION_SEND or EditorInfo.IME_FLAG_NO_EXTRACT_UI
        isHorizontalScrollBarEnabled = false
        setOnFocusChangeListener { _, focused -> onFocused(focused) }
        setOnEditorActionListener { _, action, _ ->
            if (action == EditorInfo.IME_ACTION_SEND) { onSend(); true } else false
        }
        addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = Unit
            override fun afterTextChanged(editable: Editable?) {
                if (syncing || editable == null) return
                syncing = true
                // Also render recognized tokens pasted from another Meewav message.
                token.findAll(editable.toString()).toList().asReversed().forEach { match ->
                    image(match.groupValues[1])?.let { editable.replace(match.range.first, match.range.last + 1, it) }
                }
                val draft = serialize(editable)
                if (draft.length > 1_000) {
                    setText(render(acceptedDraft))
                    setSelection(text.length)
                    syncing = false
                    return
                }
                acceptedDraft = draft
                syncing = false
                onDraftChange(draft)
            }
        })
    }

    fun insertEmoji(name: String) {
        val image = image(name) ?: return
        val start = selectionStart.coerceAtLeast(0)
        val end = selectionEnd.coerceAtLeast(start)
        editableText.replace(start, end, image)
    }

    fun syncDraft(draft: String) {
        if (serialize(text) == draft) return // Preserve the IME composing region and selection.
        syncing = true
        acceptedDraft = draft
        setText(render(draft))
        setSelection(text.length)
        syncing = false
    }

    private fun image(name: String): SpannableStringBuilder? {
        val res = mwEmojiMap[name] ?: return null
        val drawable = context.getDrawable(res)?.mutate() ?: return null
        val side = (23 * resources.displayMetrics.density).toInt()
        drawable.setBounds(0, 0, side, side)
        return SpannableStringBuilder("\uFFFC").apply {
            setSpan(MeewavEmojiSpan(name, drawable), 0, 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
    }

    private fun render(draft: String): SpannableStringBuilder {
        val result = SpannableStringBuilder()
        var start = 0
        token.findAll(draft).forEach { match ->
            result.append(draft.substring(start, match.range.first))
            result.append(image(match.groupValues[1]) ?: match.value)
            start = match.range.last + 1
        }
        result.append(draft.substring(start))
        return result
    }

    private fun serialize(value: Spanned): String {
        val result = StringBuilder()
        var index = 0
        while (index < value.length) {
            val span = value.getSpans(index, index + 1, MeewavEmojiSpan::class.java)
                .firstOrNull { value.getSpanStart(it) == index }
            if (span == null) { result.append(value[index]); index++ }
            else { result.append("[[mw:${span.name}]]"); index = value.getSpanEnd(span) }
        }
        return result.toString()
    }
}

@Composable
internal fun WaveEmojiInput(
    draft: String,
    controller: WaveEmojiInputController,
    onDraftChange: (String) -> Unit,
    onSend: () -> Unit,
    onFocus: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    AndroidView(
        modifier = modifier,
        factory = { context -> WaveEmojiEditText(context).also { controller.editor = it } },
        update = { editor ->
            editor.onDraftChange = onDraftChange
            editor.onSend = onSend
            editor.onFocused = onFocus
            editor.syncDraft(draft)
        },
        onRelease = { editor -> if (controller.editor === editor) controller.editor = null },
    )
}
