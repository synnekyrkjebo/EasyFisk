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

## Feed og profil

Feed har faner for venner og fulgte soner. Fangster kan deles ved registrering og senere redigeres eller gjøres private igjen. Avsluttede økter kan også deles. Ingen deling er forhåndsvalgt, og GPS-koordinater publiseres ikke. Startinnleggene fra Kari, Per og Anne er innhold for prototypevisningen; de inngår aldri i brukerens personlige statistikk. Reaksjoner og kommentarer lagres lokalt.

Min side har profilbilde, presentasjon, offentlig/privat profil, rekorder, merker, utfordringer og delte bilder. Min statistikk beregnes fra brukerens egne økter, inkludert nullfangstøkter. Månedstall bruker norsk tid. En offentlig profil viser statistikk og merker; kontaktopplysninger holdes skjult, og fangstbilder følger delingsvalgene.

Rask rapportering krever at fangsten registreres innen ti minutter. Fiskestreak krever tre fiskedager på rad. Komplette fangstrapporter krever art, vekt, lengde, tidspunkt, utfall, GPS og bilde. Miljøregistreringer og ryddeaktiviteter lagres på egen profil. Fiskereglene kan bekreftes fra Min side eller ved bestilling. Sanntidsvarsler om regler, vannstand og stenginger krever en ekstern datakilde; soneoversikten lenker til informasjon om forholdene.

Kjør `npm test` for å kontrollere statistikk, personvern, deling, merker og lokal lagring.
