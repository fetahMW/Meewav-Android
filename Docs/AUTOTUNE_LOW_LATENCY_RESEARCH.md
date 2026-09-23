# Recherche Reddit / sources — 23 septembre 2026

Demande : supprimer Signalsmith Pro, conserver exactement le réducteur de
souffle validé à l'écoute, trouver un autotune libre avec très peu de latence.

Signalsmith, son adaptateur, ses contrôles et ses sources vendues sont retirés
de l'application Android. Simple/Superpowered et WaveNoiseSuppressor restent.
Aucun candidat ci-dessous n'est intégré, aucune latence Android n'est mesurée.

## Candidat prioritaire : x42 Auto Tune / fat1.lv2

Reddit : https://www.reddit.com/r/linuxaudio/comments/1ouabxm/any_real_time_autotune_recommendations/

Source : https://x42-plugins.com/x42/x42-autotune

Code : https://github.com/x42/fat1.lv2/blob/master/src/fat1.cc

Le code fixe une latence nominale de 1024 samples à 48 kHz, divisée par 8 en
mode FAST, puis ajoute 32 samples pour le rééchantillonneur : 160/48000 =
3,33 ms déclarées. Ce n'est ni le round-trip complet ni une mesure physique.
retuner.cc explique que FAST lit avant la fin de l'analyse de hauteur :
réaction de correction et délai de passage ne sont pas la même chose.

Projet plus ancien mais distribution v8.11 du 8 septembre 2026. Versions
Linux ARM/ARM64 disponibles, aucun paquet Android annoncé. Portage NDK à
évaluer, dépendances FFTW et resampler. Licence GPL (COPYING et entêtes
GPL-2.0-or-later) : évaluer la compatibilité avec la distribution MeeWav
avant toute intégration. Correction de petites erreurs ; pas de formants.

## Nouveautés / autres pistes

PitchNet, présenté récemment sur Reddit :
https://www.reddit.com/r/Reaper/comments/1w08kwh/free_and_opensource_vocal_tuner_would_like_reaper/
https://github.com/SessionLoops/PitchNet
AGPLv3, éditeur de hauteur avec capture/analyse et resynthèse neuronale.
La préécoute « real time » n'est pas une preuve de monitoring micro avec
latence de quelques ms. Pas de cible Android annoncée. Non retenu pour ce cas.

OpenVoxTuner : https://github.com/EiffelBS/OpenVoxTuner
PSOLA, modes Direct Monitoring / Low Latency. PitchShifter.cpp limite son
paramètre de latence à 8–40 ms, valeur initiale 20 ms. Ce paramètre ne prouve
pas à lui seul le délai bout-en-bout. JUCE, formats Windows/macOS ; AGPLv3 ou
licence commerciale pour incorporation propriétaire selon son README.

MXTune : https://github.com/liuanlin-mx/MXTune
Piste citée sur Reddit, VST open source. Pas de validation Android ni de
mesure à quelques ms obtenue durant cette recherche.

Prochaine validation technique pertinente : exécutable NDK isolé de x42 en
FAST, mesure par impulsion/corrélation et vraie voix, CPU/xruns, correction
des attaques, licence et dépendances. Ne pas remplacer un bouton par un nom
de moteur avant validation du trajet réel.
