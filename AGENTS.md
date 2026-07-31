# Werkafspraak voor LLM's in dit project

Deze afspraak geldt voor **elke** LLM/agent die hier code schrijft (Claude Code,
Codex/ChatGPT, Cursor, Copilot, …). Dit bestand is de canonieke bron. Activeren:
kopieer het naar de projectroot als `AGENTS.md` (Codex e.a. lezen dat vanzelf);
Claude Code leest het globaal via `~/.claude/CLAUDE.md`.
Taal: **Nederlands**.

## Over de gebruiker (Seb)
Seb is door medische factoren vergeetachtig. Ga er nooit van uit dat hij een
eerdere uitleg, toolnaam of mogelijkheid nog weet.
- **Herinner proactief** aan een handige skill/tool/aanpak, ook al is die eerder
  genoemd - met telkens één zin wat het doet.
- **Schrijf op wat hij moet kunnen terugvinden** op een vaste, vindbare plek
  (STATUS.md, README, docs, geheugen) - niet enkel in een chat die morgen weg is.

## STATUS.md bijhouden (het belangrijkst)
Aan het einde van elke werksessie - en na elke afgeronde deeltaak - werk je
`STATUS.md` in de **projectroot** bij. Leg alleen vast wat je later **niet** uit
de code of `git log` kan halen. Toets: *"Kan ik dit straks uit code + git halen?"*
Ja → overslaan. Nee → opschrijven.

De kopjes moeten **letterlijk** zo staan (een lokaal dashboard leest ze uit):

```markdown
## Nu bezig
- waar je middenin zit - één regel per onderwerp

## Volgende stap
- de éérste concrete actie voor de volgende sessie (begin daar)

## Blokkades
- alles wat op de gebruiker wacht: ontbrekende secrets, accounts, keuzes, credentials

## Gedaan
- kort afgerond deze sessie
```
Lege secties mag je weglaten. Houd het kort - een kompas, geen logboek.
Werk je in een git-worktree, schrijf STATUS.md dan in de **hoofd-projectroot**.

## Hoe je werkt
- **Plan eerst bij grote of onomkeerbare wijzigingen.** Stel een concreet plan
  voor vóór je ingrijpend code wijzigt; vraag waar te starten als de prioriteit
  onduidelijk is.
- **Behoud werkende functionaliteit.** Verbeter (veiligheid, leesbaarheid,
  structuur) zonder bestaand gedrag te breken.
- **Houd het simpel.** Geen framework of extra dependencies tenzij Seb erom vraagt.
- **Commit/push alleen als Seb erom vraagt**, en werk op een branch, niet op main.
- **Test in de échte context.** Voor lokale webtools telt de browser
  (`http://localhost/...`), niet enkel de CLI - resultaten kunnen verschillen.

## Secrets & beslissingen
- **Raak credentials/secrets nooit aan en vul ze nooit in.** Benoem ze als
  blokkade onder `## Blokkades`, met wat Seb precies moet doen (welke sleutel, waar).
- **Niet-vanzelfsprekende beslissingen + waarom** en **topologie** (deploy-pad,
  repo, branch) horen in `docs/` of de projectnotities.

## Omgeving (deze machine) - LEES DIT VOOR JE IETS AANMAAKT

**XAMPP draait ALTIJD. Alles onder `C:\server\htdocs` is dus een LIVE site.**
Die mappen zijn geen werkruimte: ze zijn versiebeheerd met git en gepusht naar
GitHub, en dat is de bescherming. Niet kopieren, niet dupliceren, niet parkeren.

Daaruit volgen drie harde regels:

1. **Maak NOOIT een git-worktree of kopie onder `C:\server\htdocs`.** Een
   worktree in `<repo>\.claude\worktrees\` is een VOLLEDIGE tweede kopie van de
   site, die Apache gewoon meeserveert. Je krijgt dan twee live sites die uit
   elkaar lopen. Werk altijd rechtstreeks in de repomap zelf.
2. **Verifieer via de URL die Seb ook ziet:** `http://localhost/<repo>/`. Start
   geen tweede webserver op een andere poort voor een map die Apache al
   serveert; die twee kunnen verschillende bestanden tonen en dan lijkt het op
   een regressie terwijl je gewoon naar de verkeerde kopie kijkt.
3. **Zie je toch een tweede kopie, meld het meteen en ruim het op.** Zoek met
   `find C:/server/htdocs -name "<kenmerkend-bestand>" -not -path "*/node_modules/*"`.

Dit is op 2026-07-31 echt misgegaan: `vanilla.waves` toonde een oude
landingspagina en `p5.waves` serveerde twee extra kopieen van zijn eigen site,
allemaal HTTP 200. Er stonden toen 27 worktree-mappen verspreid over 12 repo's.

Vangnet sindsdien: `C:\server\htdocs\.htaccess` 404't alles onder `.claude/`,
voor ALLE projecten tegelijk. Dat bestand staat buiten versiebeheer, dus het kan
verdwijnen bij een herinstallatie. De regels hierboven blijven de echte
bescherming; het vangnet is alleen de tweede lijn.

Apache/XAMPP draait hier als **NT AUTHORITY\SYSTEM**, niet als de gebruiker. Dat
breekt twee dingen in lokale PHP-tools als je er niet op rekent:
- `getenv('USERPROFILE')` wijst naar de systemprofile → val terug op een bekend
  gebruikerspad.
- `git` weigert repo's van de gebruiker ("dubious ownership") → geef aanroepen
  `git -c safe.directory=*` mee.
