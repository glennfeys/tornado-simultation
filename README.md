# Project Modelleren & Simuleren (AJ 2019-2020): Tornado Simulaties
Groepsleden: Laurens Debackere, Glenn Feys, Ben Boydens

In het kader van het project Modelleren en Simuleren onderzoeken we de Reynolds Averaged Navier Stokes vergelijking in toepassing op Tornado’s (vortexen), een [RANS](https://en.wikipedia.org/wiki/Reynolds-averaged_Navier%E2%80%93Stokes_equations) is een klasse Navier-Stokes vergelijkingen voor het modelleren van turbulente stromen in onsamendrukbare vloeistoffen.

# Uitvoeren van de code
Gelieve `yarn` te gebruiken in plaats van `npm` om problemen te vermijden bij het mergen van pull requests. Om de lokale server te draaien doe eerst `yarn` om de dependencies te installeren en vervolgens `yarn start` waarna je naar [localhost:1234](http://localhost:1234) om een preview te bekijken.

# Onderzoeksvragen
## Wiskunde
- [ ] Implementatie van enerzijds de Navier Stokes vergelijking en anderzijds de nodige aanpassingen aan deze oplossingsmethode voor de Reynolds uitmiddeling. ([Gerelateerde Github Issues](https://github.ugent.be/lvdbacke/MoSi-Project_2019-2020/issues?q=is%3Aissue+is%3Aopen+label%3A%22Navier-Stokes+Solver%22))
- [ ] Literatuurstudie naar de oplosbaarheid van RANS voor grote Reynoldsgetallen (het Reynoldsgetal Re is een parameter in de RANS vergelijking, deze heeft een impact op de stroom via een aantal parameters die in de formule ervan kunnen worden gebruikt). De RANS vergelijkingen zijn niet oplosbaar voor hoge Reynoldsgetallen, het kan interessant zijn in het verslag context te geven waarom dit zo is. Ook de impact van de randvoorwaarden bij het oplossen van de partiële differentiaalvergelijkingen en de gevisualiseerde Tornado kan hierbij besproken worden.
- [ ] Aanvullend bij voorgaand punt lijkt het interessant om in de simulatie de parameters van het Reynolds-getal door de gebruiker te laten aanpassen om de invloed op de cycloon te zien. ([Gerelateerde Github Issues](https://github.ugent.be/lvdbacke/MoSi-Project_2019-2020/issues?q=is%3Aissue+is%3Aopen+label%3Averslag))
- [ ] Een bijkomend interessant punt aangehaald in de thesis van Ding is de impact van de deeltjessimulatie op de kleur en samenstelling van de tornado.  De auteur stelt een aantal aanpassingen aan het traditionele particle rendering algoritme voor om een natuurgetrouwere simulatie te bekomen op vlak van onder andere kleur. Het zou boeiend kunnen zijn om na te gaan of dit in Three.Js kan geïmplementeerd worden, voor zover de tijd dit natuurlijk toelaat.
## Computerwetenschap
- [ ] De Reynolds Averaged Navier stokes vergelijkingen zijn, zo lijkt het althans op dit moment voor ons, computationeel best intensief om uit te voeren. Het lijkt daarom wenselijk om een optimalisatie uit te voeren van deze berekeningen aan de hand van WebAssembly en C++.
- [ ] Ook lijkt het ons best leuk om eens de tornado simulatie afgewerkt is een VR component hieraan toe te voegen, zo kan je een gesimuleerde tornado in VR bekijken of zelfs in het oog van die tornado gaan staan.
