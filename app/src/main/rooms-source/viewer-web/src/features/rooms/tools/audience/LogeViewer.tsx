import { useState, type ReactNode, type FormEvent } from "react";
import {
  Headphones,
  MessageCircleQuestion,
  Gift,
  ArrowRight,
  LockKeyhole,
  UsersRound,
  Check,
  Send,
} from "lucide-react";
import {
  buildMessagingRoute,
  isMessagingUuid,
} from "../../../messaging/messaging.route";
import type {
  LogeState,
  RoomPerson,
  RoomToolsCommand,
} from "../roomTools.types";
import "./loge-viewer.css";
import { LogeRequestLists } from "./LogeRequests";
type Props = {
  requestsEnabled?: boolean;
  experiences?: Array<{id:string;type:string;detail:string;status:string}>;
  onRespondExperience?: (id:string,accept:boolean)=>Promise<unknown>;
  loge: LogeState;
  accountId: string;
  viewer: RoomPerson;
  hostName: string;
  eligible: boolean;
  canEngage: boolean;
  busy: boolean;
  preview: ReactNode;
  onOpenChat?: () => void;
  execute: (command: RoomToolsCommand) => Promise<unknown>;
};
const statusLabel = {
  pending: "En attente",
  scheduled: "Prévu",
  accepted: "Accepté",
  declined: "Décliné",
  live: "En cours",
  completed: "Reçu",
  cancelled: "Annulé",
};
export default function LogeViewer({
  requestsEnabled = true, experiences = [], onRespondExperience,
  loge,
  accountId,
  viewer,
  hostName,
  eligible,
  canEngage,
  busy,
  preview,
  onOpenChat,
  execute,
}: Props) {
  const [panel, setPanel] = useState<"moment" | "questions" | "personal">(
      "moment",
    ),
    [question, setQuestion] = useState(""),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const ownQuestions = loge.questions.filter((q) => q.author.id === accountId);
  const pendingQuestion = ownQuestions.some(q => q.status === "pending" || q.status === "selected");
  const selected = loge.questions.find((q) => q.status === "selected");
  const moments = loge.moments.filter((m) => m.beneficiary.id === accountId);
  const invitation = moments.find(
    (m) =>
      m.kind === "face-to-face" &&
      ["scheduled", "accepted", "live"].includes(m.status),
  );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || busy || !canEngage || !loge.questionsOpen || pendingQuestion) return;
    setError("");
    setSent(false);
    try {
      await execute({
        type: "loge.question.add",
        question: {
          id: crypto.randomUUID(),
          author: { ...viewer, id: accountId },
          text: question.trim(),
          status: "pending",
          invited: false,
          sentAt: new Date().toISOString(),
        },
      });
      setQuestion("");
      setSent(true);
    } catch {
      setError(
        "Votre question n’a pas été envoyée. Réessayez, votre texte est conservé.",
      );
    }
  };
  const respond = async (accept: boolean) => {
    if (!invitation || busy || !canEngage) return;
    setError("");
    try {
      await execute({
        type: "loge.moment.respond",
        momentId: invitation.id,
        accountId,
        accept,
      });
    } catch {
      setError("La réponse n’a pas été enregistrée. Réessayez.");
    }
  };
  return (
    <div className={`loge-viewer${panel === "personal" ? " is-request-list" : ""}`}>
      {eligible ? <>
          <nav className="loge-viewer__tabs" aria-label="Explorer la Loge">
            {(
              [
                { id: "moment", label: "VIP", Icon: Headphones },
                {
                  id: "questions",
                  label: "Questions",
                  Icon: MessageCircleQuestion,
                },
                { id: "personal", label: "Invitations", Icon: Gift },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                type="button"
                aria-pressed={panel === id}
                onClick={() => setPanel(id)}
                key={id}
              >
                <Icon />
                <span>{label}</span>
                {id === "moment" && moments.length > 0 ? (
                  <b>{moments.length}</b>
                ) : null}
              </button>
            ))}
          </nav>
      </> : null}
      <header className="loge-viewer__welcome" hidden={panel !== "moment"}>
        <div className="loge-viewer__eyebrow">
          <span className="loge-viewer__live" />
          LA LOGE<span>{eligible ? "ACCÈS MEMBRE" : "ACCÈS PRIVÉ"}</span>
        </div>
        <h2>Un moment à part.</h2>
        <p>
          Avec <strong>{hostName}</strong>, au plus près de la création.
        </p>
      </header>
      {!eligible ? (
        <section className="loge-viewer__card loge-viewer__empty">
          <LockKeyhole />
          <h3>Cette Loge est réservée</h3>
          <p>
            Une invitation ou un accès VIP est nécessaire pour rejoindre les
            échanges et découvrir les contenus de l’artiste.
          </p>
        </section>
      ) : (
        <>
          {panel === "moment" && invitation ? (
            <section className="loge-viewer__invitation" role="status">
              <UsersRound />
              <div>
                <small>VOTRE INVITATION</small>
                <strong>
                  {invitation.status === "live"
                    ? "Votre face-à-face est en cours"
                    : invitation.status === "accepted"
                      ? "Invitation acceptée"
                      : "L’artiste vous invite à échanger"}
                </strong>
                <p>
                  {invitation.status === "accepted"
                    ? "Préparez votre micro et votre caméra à la prochaine étape."
                    : "Vous choisissez de participer. Votre micro reste éteint avant votre accord."}
                </p>
              </div>
              {invitation.status === "scheduled" ? (
                <div className="loge-viewer__actions">
                  <button
                    disabled={busy || !canEngage}
                    onClick={() => void respond(true)}
                  >
                    <Check />
                    Accepter
                  </button>
                  <button
                    disabled={busy || !canEngage}
                    onClick={() => void respond(false)}
                  >
                    Pas maintenant
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}


          {error ? (
            <p className="loge-viewer__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="loge-viewer__content">
            {panel === "personal" ? <section className="loge-viewer__card"><h3>Les invitations de l’artiste</h3><p>Concert, rencontre, session studio ou scène partagée.</p>{experiences.length ? experiences.map(invite=><article className="loge-viewer__card" key={invite.id}><h4>{invite.type}</h4><p>{invite.detail}</p><small>{{pending:"En attente de votre réponse",accepted:"Acceptée · à organiser",declined:"Déclinée",cancelled:"Annulée",completed:"Expérience réalisée"}[invite.status]}</small>{invite.status==='pending'&&onRespondExperience?<div className="loge-viewer__actions"><button disabled={busy} onClick={()=>void onRespondExperience(invite.id,true).catch(()=>setError("Votre réponse n’a pas été enregistrée."))}>Accepter</button><button disabled={busy} onClick={()=>void onRespondExperience(invite.id,false).catch(()=>setError("Votre réponse n’a pas été enregistrée."))}>Décliner</button></div>:null}</article>):<p>Vos invitations personnelles apparaîtront ici lorsque l’artiste vous en proposera une.</p>}</section>:null}

            <div className="loge-viewer__moment" hidden={panel !== "moment"}>
              {preview ? <section className="loge-viewer__card loge-viewer__preview">
                <div className="loge-viewer__section-label">
                  <Headphones />
                  <span>AVANT-PREMIÈRE</span>
                  <small>
                    {loge.preview.transportStatus === "playing"
                      ? "En diffusion"
                      : loge.preview.transportStatus === "paused"
                        ? "En pause"
                        : "À découvrir"}
                  </small>
                </div>
                <h3>
                  {loge.preview.title || "Dans les coulisses de la création"}
                </h3>
                {loge.preview.description ? (
                  <p>{loge.preview.description}</p>
                ) : null}
                {preview}
              </section> : null}
              <button
                className="loge-viewer__question-cta"
                onClick={() => setPanel("questions")}
              >
                <MessageCircleQuestion />
                <span>
                  <strong>Une question pour l’artiste ?</strong>
                  <small>
                    {loge.questionsOpen
                      ? "Partagez ce que vous aimeriez savoir"
                      : "Découvrez les questions et vos envois"}
                  </small>
                </span>
                <ArrowRight />
              </button>
              {onOpenChat ? (
                <button className="loge-viewer__chat" onClick={onOpenChat}>
                  Retrouver les fans dans le chat
                  <ArrowRight />
                </button>
              ) : null}
            </div>
            {panel === "moment" && requestsEnabled ? <LogeRequestLists loge={loge} viewer={{...viewer, id: accountId}} disabled={busy || !canEngage} execute={execute} /> : null}
              {panel === "questions" && selected ? (
                <section className="loge-viewer__card loge-viewer__selected">
                  <small>L’ARTISTE VOUS RÉPOND</small>
                  <blockquote>« {selected.text} »</blockquote>
                  <span>@{selected.author.name}</span>
                </section>
              ) : null}
            {panel === "questions" ? (
              <section className="loge-viewer__card">
                <div className="loge-viewer__section-label">
                  <MessageCircleQuestion />
                  <span>LA PAROLE AUX FANS</span>
                </div>
                <h3>
                  {loge.questionsOpen
                    ? "À vous de demander."
                    : "Les questions sont en pause."}
                </h3>
                {canEngage && loge.questionsOpen && !pendingQuestion ? (
                  <form className="loge-viewer__question" onSubmit={submit}>
                    <label htmlFor="loge-viewer-question">
                      Votre question <small>{question.length}/280</small>
                    </label>
                    <textarea
                      id="loge-viewer-question"
                      disabled={busy}
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value);
                        setSent(false);
                      }}
                      maxLength={280}
                      rows={3}
                      placeholder="Un morceau, une inspiration, une anecdote…"
                    />
                    <button disabled={busy || !question.trim()}>
                      <Send />
                      Envoyer
                    </button>
                  </form>
                ) : (
                  <p>{pendingQuestion ? "Votre question attend la réponse de l’artiste. Vous pourrez en poser une nouvelle ensuite." : "L’artiste choisit le moment d’ouvrir les questions."}</p>
                )}
                {sent ? (
                  <p className="loge-viewer__success" role="status">
                    <Check />
                    Votre question est envoyée.
                  </p>
                ) : null}
                <div className="loge-viewer__history">
                  <h4>
                    Mes questions
                    {ownQuestions.length ? ` · ${ownQuestions.length}` : ""}
                  </h4>
                  {ownQuestions.length ? (
                    ownQuestions.map((q) => (
                      <article key={q.id}>
                        <p>{q.text}</p>
                        <small>
                          {q.status === "pending"
                            ? "Envoyée"
                            : q.status === "selected"
                              ? "Sélectionnée"
                              : q.status === "answered"
                                ? "Répondue"
                                : "Non retenue"}
                        </small>
                      </article>
                    ))
                  ) : (
                    <p>Vos questions et leur statut apparaîtront ici.</p>
                  )}
                </div>
              </section>
            ) : panel === "moment" ? (
              <section className="loge-viewer__card">
                <div className="loge-viewer__section-label">
                  <Gift />
                  <span>MES MOMENTS VIP</span>
                </div>
                <h3>Vos moments et dédicaces.</h3>
                <p>Retrouvez ici vos échanges et vos souvenirs personnalisés.</p>
                {moments.length ? (
                  <div className="loge-viewer__moments">
                    {moments.map((m) => {
                      const conversation = m.privateContent?.startsWith(
                        "conversation:",
                      )
                        ? m.privateContent.slice(13)
                        : null;
                      return (
                        <article key={m.id}>
                          <span className="loge-viewer__moment-icon">
                            {m.kind === "face-to-face" ? (
                              <UsersRound />
                            ) : (
                              <Gift />
                            )}
                          </span>
                          <div>
                            <strong>{m.title}</strong>
                            <small>{m.requested && m.status === "completed" ? "Demande traitée" : statusLabel[m.status]}</small>
                            {m.status === "completed" &&
                            conversation &&
                            isMessagingUuid(conversation) ? (
                              <a
                                href={buildMessagingRoute({
                                  conversationId: conversation,
                                })}
                              >
                                Ouvrir ma dédicace
                                <ArrowRight />
                              </a>
                            ) : null}
                            {m.status === "completed" &&
                            (m.privateContent?.startsWith("blob:") || m.privateContent?.startsWith("/native/loge-media?")) ? (
                              m.format === "video" ? (
                                <video
                                  src={m.privateContent}
                                  controls
                                  playsInline
                                />
                              ) : m.format === "audio" ? (
                                <audio src={m.privateContent} controls />
                              ) : null
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="loge-viewer__empty">
                    <Gift />
                    <strong>Le meilleur reste à venir.</strong>
                    <p>
                      Lorsqu’une invitation ou une dédicace vous est adressée,
                      vous la retrouvez ici.
                    </p>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
