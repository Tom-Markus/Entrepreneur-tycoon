# Équilibrage par simulation

Outil : [`tools/simulate.js`](../tools/simulate.js). Des bots jouent des
parties complètes **en n'utilisant que l'API publique du moteur**
(`applyAction`), exactement comme un joueur, mois par mois, sur 20 ans de jeu
maximum. Chaque combinaison secteur × difficulté × stratégie est jouée 30 fois
(graines différentes ; statut alterné indépendant/SRL).

```bash
node tools/simulate.js --games 30 --years 20          # tableau complet (≈ 6 min)
node tools/trace.js restaurant realiste optimale srl 3 15   # une partie, année par année
```

## Les bots

| Stratégie | Comportement |
|---|---|
| **passive** | Ne touche à rien : réglages par défaut, aucune embauche, aucun placement. |
| **prudente** | Réserve de 6 mois, recrute tard, investit surtout en épargne, n'achète une amélioration que si elle a 3× son prix en caisse. |
| **agressive** | Réserve d'un mois, marketing élevé, recrute tôt, actions et immobilier à crédit. |
| **optimale** (« bot raisonnable ») | Prix pilotés par la capacité (jamais sous 90 % du prix du marché indexé), réserve de 2 mois + impôt estimé, recrute quand le carnet déborde, licencie si pertes durables, gérant puis retrait quand le bénéfice couvre 1,5× son coût, dividendes (SRL), place l'excédent (ETF, épargne, immobilier). |

Les bots sont volontairement simples : un humain attentif fait mieux (il
anticipe les saisons, choisit ses améliorations, réagit aux événements).

## Objectifs (cahier des charges)

| Objectif | Résultat |
|---|---|
| Une stratégie passive doit échouer | ✅ **0 % de victoires** partout (et jusqu'à 100 % de faillites en Difficile). |
| Bot raisonnable en Réaliste : ≈ 5 à 15 % de victoires | ✅ Moyenne des 5 secteurs ≈ **13 %** (agence 7 %, friterie 7 %, e-commerce 20 %, artisan 23 %, soutien 7 %). |
| Une bonne stratégie doit pouvoir gagner | ✅ Facile : 60 à 100 % de victoires selon le secteur ; Normal : 10 % (agence) à 57 % (artisan). |
| Aucun secteur dominant | ✅ en Réaliste aucun secteur ne dépasse ≈ 23 % pour le meilleur bot. Avec 30 parties, l'incertitude est d'environ ±10 points : les écarts entre secteurs sont en partie du bruit. |

L'agence est le secteur le plus exigeant en Normal (10 %) : elle demande de
construire du récurrent (maintenance, SaaS) que le bot exploite mal.

Profil par secteur (Réaliste) : l'**e-commerce** est le plus volatil (20 % de
victoires mais 57 % de faillites), l'**artisan** le plus régulier (17 % de
faillites), le **soutien scolaire** est fragile (marges faibles, creux d'été,
77 % de faillites du bot optimal mais 20 % de victoires pour le prudent),
l'**agence** et la **friterie** exigent de bien doser les embauches. Délai
médian de victoire : 9 à 20 ans de jeu (≈ 2 à 4 h de jeu réel à ×4).

## Résultats complets (version finale)

```
Simulation : 30 parties × 20 ans max par combinaison (338.2 s)

secteur      difficulté  stratégie   victoires faillites  an.victoire an.faillite  score méd.  score p90  cause n°1
agence       facile      passive       0 %       0 %          -           -        4274       4948  -
agence       facile      prudente     10 %       0 %       16.8           -       12844      24738  -
agence       facile      agressive    33 %      70 %        8.7        11.7         723      13086  salaires
agence       facile      optimale     60 %       3 %       14.7        18.8       18966      34343  impayes
agence       normal      passive       0 %       0 %          -           -        4666       5240  -
agence       normal      prudente      0 %      10 %          -        17.2       10034      19510  impayes
agence       normal      agressive    10 %      83 %        8.3        13.0         843       4597  salaires
agence       normal      optimale     10 %      23 %       15.7        13.7       10421      23985  rentabilite
agence       realiste    passive       0 %       0 %          -           -        4751       5794  -
agence       realiste    prudente      0 %      30 %          -        17.6       10762      18637  rentabilite
agence       realiste    agressive     0 %      93 %          -        11.5         467       1565  salaires
agence       realiste    optimale      7 %      33 %       19.5        15.1       10712      31036  rentabilite
agence       difficile   passive       0 %      10 %          -         0.6        4549       5691  investissement
agence       difficile   prudente      0 %      33 %          -        18.2       11898      20621  rentabilite
agence       difficile   agressive     0 %      97 %          -        10.1         629       1726  salaires
agence       difficile   optimale      0 %      60 %          -        15.9        1185      23866  rentabilite
restaurant   facile      passive       0 %       0 %          -           -        5253       5853  -
restaurant   facile      prudente     90 %       0 %        7.6           -       82606     148020  -
restaurant   facile      agressive    87 %      10 %        4.2         9.4       67064     153015  rentabilite
restaurant   facile      optimale    100 %       0 %        7.7           -       80052     154747  -
restaurant   normal      passive       0 %       0 %          -           -        3657       6036  -
restaurant   normal      prudente     33 %       0 %       17.7           -       23854      74368  -
restaurant   normal      agressive    47 %      20 %       12.5        11.7       15957     105896  rentabilite
restaurant   normal      optimale     40 %       0 %       14.4           -       18214      52582  -
restaurant   realiste    passive       0 %       0 %          -           -        3645       5454  -
restaurant   realiste    prudente      3 %       3 %       19.6        17.9        9856      41403  tva
restaurant   realiste    agressive    17 %      27 %       19.3        15.6        8370      48386  rentabilite
restaurant   realiste    optimale      7 %       3 %       19.7        15.0       12411      29447  rentabilite
restaurant   difficile   passive       0 %       3 %          -        16.6        1958       3839  investissement
restaurant   difficile   prudente      0 %      10 %          -        18.6        6990      17403  tva
restaurant   difficile   agressive     0 %      57 %          -        12.2        1861      16870  rentabilite
restaurant   difficile   optimale      0 %      20 %          -        16.2        4555      10739  rentabilite
ecommerce    facile      passive       0 %       0 %          -           -        7315      12572  -
ecommerce    facile      prudente     50 %       0 %       14.5           -       37299      56755  -
ecommerce    facile      agressive    93 %       3 %       10.1         6.7       46063     103196  demande
ecommerce    facile      optimale     97 %       0 %       10.7           -       49295      70037  -
ecommerce    normal      passive       0 %       0 %          -           -        5607       8551  -
ecommerce    normal      prudente     17 %       0 %       18.7           -       15067      45063  -
ecommerce    normal      agressive    23 %      53 %       16.7         5.7         237      40680  rentabilite
ecommerce    normal      optimale     43 %      10 %       15.5         8.2       26190      52966  tva
ecommerce    realiste    passive       0 %      47 %          -         2.7        2325       7283  rentabilite
ecommerce    realiste    prudente      0 %      23 %          -        12.3        2066      28170  rentabilite
ecommerce    realiste    agressive     7 %      57 %       20.0         7.1         419      20595  demande
ecommerce    realiste    optimale     20 %      57 %       16.8         5.6         197      66195  rentabilite
ecommerce    difficile   passive       0 %     100 %          -         0.7          75        112  rentabilite
ecommerce    difficile   prudente      0 %     100 %          -         0.9          75        187  rentabilite
ecommerce    difficile   agressive     0 %     100 %          -         0.9          75        225  rentabilite
ecommerce    difficile   optimale      0 %     100 %          -         1.6         109        169  rentabilite
artisan      facile      passive       0 %       0 %          -           -        9049       9516  -
artisan      facile      prudente    100 %       0 %        9.5           -       26335      45873  -
artisan      facile      agressive    77 %      13 %        7.4        17.9       12692      21542  impayes
artisan      facile      optimale    100 %       0 %        5.4           -       19211      32111  -
artisan      normal      passive       0 %       0 %          -           -        9657      10535  -
artisan      normal      prudente     70 %       0 %       12.4           -       21911      42194  -
artisan      normal      agressive     3 %      40 %        9.3        13.2        3827      11652  impayes
artisan      normal      optimale     57 %       0 %        9.7           -       15514      23955  -
artisan      realiste    passive       0 %       0 %          -           -       10661      12871  -
artisan      realiste    prudente     13 %       0 %       17.6           -       24302      33082  -
artisan      realiste    agressive     0 %      97 %          -        13.1         680       1907  impayes
artisan      realiste    optimale     23 %      17 %        9.4        17.5       13105      26984  impayes
artisan      difficile   passive       0 %      30 %          -         0.3        8113      13649  investissement
artisan      difficile   prudente      0 %      13 %          -         0.5       20424      38686  investissement
artisan      difficile   agressive     0 %      97 %          -         3.2         596       1499  impayes
artisan      difficile   optimale      0 %      47 %          -         0.6        4689      20441  impayes
soutien      facile      passive       0 %       0 %          -           -        1945       2983  -
soutien      facile      prudente     40 %      10 %        6.2        16.3        8793      20790  salaires
soutien      facile      agressive    73 %      70 %        3.5        13.3        2761      20974  salaires
soutien      facile      optimale     63 %      30 %        4.3        14.5        9485      32521  salaires
soutien      normal      passive       0 %       0 %          -           -        1737       2552  -
soutien      normal      prudente     23 %      23 %        8.2        15.2        3788      17728  salaires
soutien      normal      agressive     3 %      80 %       16.2        11.0         443       6222  salaires
soutien      normal      optimale     23 %      50 %        4.3        13.7        2780      13251  salaires
soutien      realiste    passive       0 %       0 %          -           -        1805       2786  -
soutien      realiste    prudente     20 %      20 %       10.6        18.7        2753      13783  salaires
soutien      realiste    agressive    10 %      93 %        3.5        10.7         621       4660  salaires
soutien      realiste    optimale      7 %      77 %       11.4        14.7         359       7190  salaires
soutien      difficile   passive       0 %      20 %          -        19.7        1149       1800  rentabilite
soutien      difficile   prudente      7 %      43 %       16.6        16.6        1527      12333  rentabilite
soutien      difficile   agressive     0 %      93 %          -         8.9         683       2963  salaires
soutien      difficile   optimale      0 %      90 %          -        11.6         380       1798  salaires
```

Lecture : « an.victoire » / « an.faillite » = médianes en années de jeu ;
« cause n°1 » = première cause du post-mortem la plus fréquente.

## Ce que la simulation a révélé (et ce qui a été corrigé)

L'équilibrage a été itératif ; chaque passage a mis au jour de vrais défauts
de conception, pas seulement des chiffres à ajuster :

1. **Boucle infinie** : une faillite pendant qu'une décision était en attente
   bloquait la partie (la décision n'était plus jouable). Corrigé dans le
   moteur (les décisions sont annulées à la faillite) + test.
2. **Centimes flottants** : un prélèvement calculé avec `× 0,5` produisait des
   demi-centimes (détecté par le test « trésorerie entière »). Corrigé.
3. **Marché infini** : l'agence atteignait 30 employés et 84 % de parts de
   marché en 5 ans car marque et commerciaux multipliaient la taille du
   marché. Ils agissent désormais sur l'attractivité (part bornée), avec des
   rendements décroissants, et les concurrents réagissent (marketing, qualité,
   nouveaux entrants) quand le joueur domine.
4. **Victoire instantanée** : le revenu passif de l'entreprise comptait les
   mois où le fondateur travaillait encore. Il ne compte plus que les mois
   depuis son retrait (≥ 2) et 70 % du bénéfice (le reste est réinvesti).
5. **SaaS trop puissant** : jusqu'à 1 500 abonnés (≈ 40 k€/mois). Plafonné à
   un marché de niche (≈ 1 000 abonnés), croissance et coûts serveur revus.
6. **Productivité irréaliste** : les améliorations de l'agence menaient à 10 h
   facturables/jour/personne. Ramené à ≈ 5,5 h (réalité d'une agence).
7. **Indexation sans inflation** : l'indexation des salaires faisait fondre
   toutes les marges en 10 ans car les prix du marché restaient fixes. Ajout
   d'une inflation générale (prix de référence, coûts, salaires, objectif).
8. **Friterie bloquée** : il fallait un cuisinier ET un vendeur pour augmenter
   la capacité. Nouveau modèle : capacité = min(personnel, équipement).
9. **Démarrage impossible** : en Difficile, l'artisan ne pouvait pas payer sa
   camionnette (faillite en 2 mois). Ajout d'un prêt de démarrage automatique.
10. **Soutien scolaire non viable** : salaires fixes + été vide = faillite.
    Les enseignants sont payés à l'heure (pratique courante du secteur).
11. **E-commerce** : coût d'acquisition > marge. Panier moyen (1,35 article),
    visiteurs payés moins convertis, saturation des enchères publicitaires.
12. **Bots irréalistes** : réserve qui comptait les achats de stock, baisse de
    prix sous le coût, licenciements en cascade sur des mois « creux ». Corrigé
    (ce sont des outils de mesure : un bot absurde fausse l'équilibrage).

## Limites connues

- **Bruit** : 30 parties par case donnent un intervalle d'environ ±10 points ;
  pour une mesure fine, lancer `--games 100` (≈ 20 min).
- **Sensibilité** : certains secteurs (artisan, friterie) réagissent fortement
  à de petits changements de taille de marché (dynamique non linéaire :
  embauches, concurrents qui réagissent). Les valeurs retenues sont un
  compromis, documenté dans `src/data/sectors/*.js`.
- **Difficile** : l'e-commerce y est presque injouable pour les bots (stock à
  financer avec 6 000 €) ; c'est voulu comme défi pour joueurs experts
  (financement, petits stocks, marketing très ciblé).
- Les bots ne savent pas exploiter certaines mécaniques (stages d'été,
  contrats d'entretien, SaaS dès le départ, franchise TVA) : un humain dispose
  de leviers supplémentaires.
