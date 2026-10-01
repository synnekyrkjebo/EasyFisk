# EasyFisk

Mobiltilpasset prototype for fiskere i Mandalselva.

## Kom i gang

```bash
npm install
npm run dev
```

`npm run build` kontrollerer TypeScript og bygger appen til `dist/`. `npm run preview` viser produksjonsbygget.

## Filstruktur

```text
index.html              Kartet og hovedinngangen
pages/                  HTML for fiskekort, kjøp, bestilling, innlogging og økter
scripts/
  map.js                Kart, soner og posisjonssporing
  pages/                JavaScript for hver side
  shared/               Innlogging, bestillinger, dokumenter og fiskeøkter
  data/                 Fiskesoner og informasjon fra Inatur
styles/                 Felles utseende og kjøps-/profil-/øktvisninger
assets/inatur/          Bilder av fiskesonene
src/                    Tidligere React-grunnlag (ikke inngangen til prototypen)
.github/workflows/      Publiseringsoppsett
```

Sideadressene er fortsatt `/fiskekort.html`, `/kjop.html`, `/bestilling.html`, `/logginn.html`, `/registrer.html`, `/minside.html` og `/loggfor.html`. Vite kobler disse til HTML-filene i `pages/` under utvikling og legger de ferdigbygde sidene i roten av `dist/`. Dermed fungerer navigasjon og tidligere lagrede kortlenker som før. Åpne sidene gjennom utviklingsserveren eller produksjonsbygget.

## Prototypens data

Profiler og fiskekort lagres i nettleserens localStorage; innloggingen gjelder i samme fane via sessionStorage. Dokumenter, fiskeøkter og fangstbilder lagres per profil i IndexedDB. Det finnes ingen tilkoblet konto-, betalings- eller meldingsløsning, og fangstene sendes ikke til ekstern fangstrapportering.

Ved kjøp for andre velges en venn eller mottakerens navn og e-post. Forhåndsvisning av kortmeldingen gir en kortlenke som virker i nettleseren der kortet ble lagret. Gruppekort gir ett kort per fisker, og kun mottakerens egne kort vises på profilen.

For å vise hele brukerflyten kan en fiskeøkt startes på eget fiskekort uten sperrer for sesong, kortets tidsrom eller dokumenter. Én aktiv økt om gangen og validering av økt- og fangsttid beholdes. Sesong- og kortkontroller finnes i `scripts/shared/fishing-sessions.js` for senere tilkobling til faktisk tilgjengelighet.
