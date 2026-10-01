# EasyFisk

Mobiltilpasset webapp for fiskere i Mandalselva.

## Kom i gang

```bash
npm install
npm run dev
```

Første versjon inneholder en interaktiv kartside og fast navigasjon for Kart, Fiskekort, Fangst og Profil.

Eksempelinnlogging kan testes på `logginn.html`. Trykk «Logg inn med demoprofil» eller lag en egen demoprofil via registreringssiden. Profilen lagres i nettleseren, og innloggingen gjelder i samme fane. Dette oppretter ingen ekte brukerkonto og utfører ingen betaling.

Ved kjøp for andre kan du velge en eksempelvenn eller skrive inn mottakerens navn og e-post. «Forhåndsvis kortmelding» åpner en melding med lenke til et eksempelkort. Mottakeren kan se kortet uten konto og gå videre til valgfri registrering med opplysningene fylt inn. Ingen melding sendes, og disse kortlenkene virker bare i nettleseren der de ble opprettet.

Når fiskereglene er bekreftet, lagrer «Gå til betaling» en demobestilling og åpner Fiskekort i hovedmenyen. Kortene lagres i nettleseren; ingen betaling eller melding sendes, og demokortene er ikke gyldige til fiske. Gruppekort gir ett kort per fisker.

Loggfør åpner fiskeøkter med valg mellom aktiv og tidligere økt. Økter, fangster og bilder lagres per profil i IndexedDB. Fisketidene er basert på Mandalselvas regler for 2026; nyere år blokkeres inntil fisketider er satt. Aktiv start kontrollerer sesong, eget kort, vedlagte dokumenter og at ingen annen økt pågår. Midlertidige stenginger og vanntemperatur har ingen tilkoblet datakilde; fiskeren bekrefter at elva er åpen. Fangstene sendes ikke til ekstern fangstrapportering.

For visning av prototypens brukerflyt kan økter startes på eget fiskekort uten kontroll av sesong, kortets tidsrom, dokumenter eller midlertidig stenging. Én aktiv økt om gangen og validering av økt- og fangsttid beholdes.
