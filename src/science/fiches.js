// Fiches du carnet de bord. Les données viennent de la littérature paléontologique courante.
// Quand un point est incertain ou débattu, la fiche le dit explicitement.
// Note : le monde du jeu est un écosystème « composite » du Jurassique supérieur. La plupart des
// espèces viennent de la formation de Morrison (Amérique du Nord) ; Compsognathus et
// Rhamphorhynchus vivaient à la même époque mais en Europe.

export const SECTIONS = ['Identité', 'Taille', 'Régime', 'Comportement', 'Habitat', 'Découvertes'];
export const SEUILS = [1.5, 6, 12, 20, 30, 42];   // secondes d'observation cumulées pour débloquer chaque section

export const FICHES = {
  allosaurus: {
    nom: 'Allosaurus', sci: 'Allosaurus fragilis', groupe: 'Théropode allosauridé',
    textes: [
      'Grand prédateur du Jurassique supérieur (Kimméridgien–Tithonien, il y a environ 155 à 145 millions d\'années). Nom donné par Othniel Charles Marsh en 1877 : « lézard différent ».',
      'Adulte : 8,5 m de long en moyenne, jusqu\'à près de 10 m pour les plus grands ; environ 1,5 à 2 tonnes. Deux petites crêtes osseuses au-dessus des yeux.',
      'Carnivore. Dents en lames crénelées, renouvelées toute la vie. Chassait de grands herbivores (jeunes sauropodes, stégosaures, ornithopodes) et ne dédaignait pas les carcasses.',
      'Posture horizontale, queue en balancier. La chasse en groupe est débattue : rien ne la prouve. Les juvéniles, aux pattes proportionnellement plus longues, étaient sans doute plus rapides que les adultes.',
      'Plaines semi-arides à saisons marquées, parcourues de rivières et de forêts-galeries (formation de Morrison, ouest des États-Unis). Une espèce proche a été trouvée au Portugal.',
      'La carrière de Cleveland-Lloyd (Utah) a livré les restes d\'au moins 46 individus. « Big Al », un subadulte découvert en 1991 dans le Wyoming, portait 19 os blessés ou infectés. Plumage : aucune preuve directe ; les filaments des jeunes sont ici une hypothèse.',
    ],
  },
  stegosaurus: {
    nom: 'Stegosaurus', sci: 'Stegosaurus stenops / ungulatus', groupe: 'Ornithischien thyréophore',
    textes: [
      'Herbivore cuirassé du Jurassique supérieur (environ 155 à 145 millions d\'années), nommé par O. C. Marsh en 1877 : « lézard à toit ».',
      'De 6,5 m (S. stenops) à environ 9 m (S. ungulatus) ; 3 à 5 tonnes. Dix-sept plaques dorsales sur deux rangées alternées et quatre piques au bout de la queue.',
      'Herbivore brouteur de végétation basse : fougères, prêles, cycadales. Petit bec corné et petites dents en forme de feuille.',
      'Se défendait en fouettant l\'air avec sa queue armée. Les plaques, richement vascularisées, servaient probablement à la parade et à la reconnaissance, peut-être aussi à réguler la température.',
      'Plaines et forêts claires de la formation de Morrison ; des restes proches sont connus au Portugal.',
      '« Sophie » (Muséum d\'histoire naturelle de Londres) est le squelette le plus complet connu, à environ 85 %. Une vertèbre d\'Allosaurus percée d\'un trou correspondant à une pique de Stegosaurus témoigne de combats réels. Le mot « thagomizer », pour les piques caudales, vient d\'un dessin humoristique de 1982.',
    ],
  },
  diplodocus: {
    nom: 'Diplodocus', sci: 'Diplodocus carnegii', groupe: 'Sauropode diplodocidé',
    textes: [
      'Sauropode au très long cou et à la queue en fouet, Jurassique supérieur (environ 154 à 152 millions d\'années). Nommé par O. C. Marsh en 1878 : « double poutre », d\'après la forme d\'os sous la queue.',
      'Environ 24 à 26 m de long pour 10 à 15 tonnes : très long, mais léger pour un sauropode.',
      'Herbivore. Dents en forme de crayon, à l\'avant de la gueule seulement, pour ratisser le feuillage sans le mâcher. Broutait surtout à faible et moyenne hauteur.',
      'Vivait probablement en troupeaux. Le cou était tenu plutôt à l\'horizontale. La queue, très effilée, pouvait servir de fouet dissuasif. Des empreintes de peau montrent une rangée de petites épines cornées sur le dos.',
      'Plaines inondables et forêts-galeries de la formation de Morrison.',
      'Le moulage « Dippy », offert par Andrew Carnegie, a été exposé à Londres dès 1905, puis dans de nombreux musées d\'Europe : c\'est l\'un des dinosaures les plus vus au monde.',
    ],
  },
  brachiosaurus: {
    nom: 'Brachiosaurus', sci: 'Brachiosaurus altithorax', groupe: 'Sauropode brachiosauridé',
    textes: [
      'Sauropode géant du Jurassique supérieur (environ 154 à 150 millions d\'années), décrit par Elmer Riggs en 1903 : « lézard à bras », car ses pattes avant sont plus longues que les pattes arrière.',
      'Environ 22 m de long, tête à une douzaine de mètres du sol ; masse estimée entre 30 et 50 tonnes selon les méthodes.',
      'Herbivore. Sa silhouette de girafe lui donnait accès à la cime des conifères, hors de portée des autres herbivores.',
      'Dos incliné vers l\'arrière, cou dressé. Un adulte n\'avait pratiquement pas de prédateur ; les jeunes, eux, étaient vulnérables.',
      'Forêts de conifères et plaines de la formation de Morrison. Il y était plus rare que les diplodocidés.',
      'Découvert en 1900 dans la vallée de la Grand River (Colorado). Le célèbre squelette de Berlin, trouvé en Tanzanie et longtemps appelé Brachiosaurus brancai, est aujourd\'hui classé dans un genre distinct : Giraffatitan.',
    ],
  },
  dryosaurus: {
    nom: 'Dryosaurus', sci: 'Dryosaurus altus', groupe: 'Ornithopode dryosauridé',
    textes: [
      'Petit herbivore bipède du Jurassique supérieur (environ 155 à 145 millions d\'années). Genre nommé par O. C. Marsh en 1894 : « lézard des chênes » (au sens de « lézard des arbres »).',
      'De 3 à 4 m de long pour environ 80 à 100 kg.',
      'Herbivore. Bec corné sans dents à l\'avant, dents jugales pour broyer la végétation basse.',
      'Longues pattes arrière et queue raide : un coureur dont la vitesse était la seule défense. Vivait probablement en groupes. Sa croissance était rapide.',
      'Sous-bois et plaines de la formation de Morrison. Les filaments dorsaux montrés ici sont une hypothèse, inspirée d\'autres petits ornithischiens à téguments filamenteux.',
      'Des fossiles de tous âges, des embryons aux subadultes, ont permis d\'étudier sa croissance. Les formes africaines autrefois rattachées au genre sont aujourd\'hui appelées Dysalotosaurus.',
    ],
  },
  ceratosaurus: {
    nom: 'Ceratosaurus', sci: 'Ceratosaurus nasicornis', groupe: 'Théropode cératosaurien',
    textes: [
      'Prédateur de taille moyenne du Jurassique supérieur (environ 153 à 148 millions d\'années), nommé par O. C. Marsh en 1884 : « lézard à corne ».',
      'Environ 6 à 7 m de long pour 500 kg à 1 tonne. Une corne sur le nez, deux crêtes devant les yeux, et une rangée de petits os dermiques le long du dos : cas unique chez les théropodes.',
      'Carnivore aux dents supérieures très longues. Plus petit qu\'Allosaurus, il évitait sans doute la concurrence directe ; certains auteurs lui prêtent un goût pour les proies aquatiques, hypothèse discutée.',
      'Chasseur solitaire. La corne nasale, trop fragile pour une arme, servait probablement à la parade.',
      'Formation de Morrison, souvent près des cours d\'eau ; des restes sont aussi connus au Portugal.',
      'Beaucoup plus rare qu\'Allosaurus dans les gisements. Le premier squelette, presque complet, vient de la région de Cañon City (Colorado).',
    ],
  },
  compsognathus: {
    nom: 'Compsognathus', sci: 'Compsognathus longipes', groupe: 'Théropode compsognathidé',
    textes: [
      'Minuscule théropode du Jurassique supérieur (Tithonien, environ 150 millions d\'années) d\'Europe. Décrit par Johann Andreas Wagner en 1859 : « mâchoire élégante ».',
      'De 0,9 à 1,25 m de long, queue comprise, pour environ 2,5 à 3,5 kg : la taille d\'une dinde.',
      'Carnivore : petits vertébrés et insectes. L\'un des deux squelettes contient encore son dernier repas, un petit lézard.',
      'Vif et agile. Aucun indice fossile ne prouve qu\'il vivait en bandes : les groupes montrés ici sont une liberté d\'interprétation, tout comme son rôle de charognard opportuniste.',
      'Îles et lagunes chaudes de l\'archipel européen de l\'époque.',
      'Seuls deux squelettes sont connus : l\'un de Bavière (Allemagne), l\'autre de Canjuers (sud de la France). Des cousins chinois, comme Sinosauropteryx, portaient un duvet de protoplumes : il en avait probablement aussi.',
    ],
  },
  rhamphorhynchus: {
    nom: 'Rhamphorhynchus', sci: 'Rhamphorhynchus muensteri', groupe: 'Ptérosaure (ce n\'est pas un dinosaure)',
    textes: [
      'Reptile volant du Jurassique supérieur (environ 150 millions d\'années). Genre nommé par Hermann von Meyer : « museau en bec ».',
      'Jusqu\'à 1,8 m d\'envergure environ. Longue queue raide terminée par une palette en losange.',
      'Piscivore : dents pointues dirigées vers l\'avant, idéales pour saisir des poissons. Des poissons ont été retrouvés dans l\'estomac de plusieurs spécimens.',
      'Volait au-dessus de l\'eau et attrapait ses proies près de la surface. Sa croissance était lente et continue, plus proche de celle des reptiles actuels que de celle des oiseaux.',
      'Lagunes et côtes de l\'archipel européen ; il est surtout connu par les calcaires de Solnhofen, en Bavière.',
      'Plus d\'une centaine de spécimens sont connus, parfois avec l\'empreinte des membranes alaires. Un fossile célèbre montre un Rhamphorhynchus et un poisson prédateur, Aspidorhynchus, morts enchevêtrés.',
    ],
  },
  poisson: {
    nom: 'Poissons à nageoires rayonnées', sci: 'Actinoptérygiens', groupe: 'Poissons osseux',
    textes: [
      'Les eaux douces du Jurassique supérieur abritaient de nombreux poissons osseux primitifs, ainsi que des dipneustes.',
      'Quelques dizaines de centimètres pour la plupart.',
      'Invertébrés, larves d\'insectes, petits poissons.',
      'Vivent en bancs dans les eaux calmes. Vous pouvez en attraper d\'un coup de mâchoires en eau peu profonde.',
      'Lacs, rivières lentes et lagunes.',
      'Leurs écailles épaisses et brillantes se fossilisent bien.',
    ],
  },
  libellule: {
    nom: 'Libellules', sci: 'Odonates', groupe: 'Insectes',
    textes: [
      'Les libellules volaient déjà bien avant les dinosaures. Celles du Jurassique ressemblaient beaucoup aux espèces actuelles.',
      'Une dizaine de centimètres d\'envergure, parfois davantage.',
      'Chasseuses d\'insectes en vol ; leurs larves aquatiques sont elles aussi carnivores.',
      'Vol stationnaire au-dessus de l\'eau, par temps chaud et lumineux.',
      'Berges des lacs, rivières et marais.',
      'Les calcaires de Solnhofen ont conservé des libellules jusqu\'au détail des nervures de leurs ailes. Autres insectes de l\'époque : coléoptères, blattes, et des sauterelles dont on a pu reconstituer le chant.',
    ],
  },
};

// Flore : trois sections (identité, description, le saviez-vous)
export const FLORE_FICHES = {
  sequoia: { nom: 'Grands conifères', sci: 'Cupressacées primitives', textes: ['Les conifères dominaient les forêts du Jurassique.', 'Fût droit de plusieurs dizaines de mètres, silhouette conique.', 'Les séquoias au sens strict sont plus récents : ces arbres en sont de proches parents anciens.'] },
  araucaria: { nom: 'Araucarias', sci: 'Araucariacées', textes: ['Conifères à port en parasol, très répandus au Jurassique.', 'Branches en étages, feuilles en écailles coriaces.', 'Leurs descendants vivent encore dans l\'hémisphère Sud. Les troncs fossiles de la « forêt pétrifiée » d\'Arizona sont des cousins plus anciens.'] },
  ginkgo: { nom: 'Ginkgos', sci: 'Ginkgoales', textes: ['Arbres à feuilles en éventail, abondants et variés au Jurassique.', 'Feuillage caduc, souvent fendu en deux lobes.', 'Une seule espèce survit aujourd\'hui, Ginkgo biloba : un véritable fossile vivant.'] },
  fougereArbo: { nom: 'Fougères arborescentes', sci: 'Cyathéales et groupes voisins', textes: ['Fougères dont le « tronc » est fait de racines et de bases de frondes.', 'Couronne de grandes frondes au sommet d\'un stipe de quelques mètres.', 'Elles aiment l\'humidité : on les trouve près de l\'eau et en sous-bois.'] },
  cycas: { nom: 'Cycadales et Bennettitales', sci: 'Cycadophytes', textes: ['Plantes trapues à feuilles raides, si communes que le Jurassique est parfois appelé « l\'âge des cycadales ».', 'Tronc court en tonneau, couronne de feuilles pennées.', 'Les Bennettitales, aujourd\'hui disparues, leur ressemblaient beaucoup sans être de proches parentes.'] },
  fougere: { nom: 'Fougères', sci: 'Polypodiopsides', textes: ['Au Jurassique, ce sont les fougères qui tapissent le sol : l\'herbe n\'existe pas encore.', 'Frondes découpées, reproduction par spores.', 'Les graminées n\'apparaîtront qu\'à la fin du Crétacé, et les prairies bien plus tard.'] },
  prele: { nom: 'Prêles', sci: 'Equisetum', textes: ['Plantes à tiges segmentées des milieux humides.', 'Tiges creuses, rameaux en verticilles, riches en silice.', 'Le genre Equisetum existe toujours : c\'est l\'un des plus anciens genres de plantes vivantes.'] },
};

// Comportements à documenter. `etat` = comportement observé chez l'animal ; `especes` = qui peut le montrer.
export const OBSERVATIONS = [
  { id: 'abreuvage', titre: 'Abreuvage', etat: 'boit', texte: 'Un animal vient boire à la berge.' },
  { id: 'broutage', titre: 'Broutage', etat: 'broute', texte: 'Un herbivore se nourrit de végétation.' },
  { id: 'fuite', titre: 'Fuite coordonnée', etat: 'fuit', especes: ['dryosaurus', 'compsognathus'], texte: 'Tout un groupe prend la fuite dans la même direction.' },
  { id: 'vigilance', titre: 'Vigilance', etat: 'alerte', texte: 'Un animal relève la tête et surveille les alentours.' },
  { id: 'sommeil', titre: 'Sommeil', etat: 'dort', texte: 'Un animal se repose, couché au sol.' },
  { id: 'nidification', titre: 'Nidification', etat: 'couve', texte: 'Un adulte veille sur un nid.' },
  { id: 'defense', titre: 'Défense', etat: 'defend', texte: 'Un grand herbivore présente sa queue à la menace.' },
  { id: 'chasse', titre: 'Chasse', etat: 'chasse', texte: 'Un prédateur poursuit une proie : interaction entre espèces.' },
  { id: 'charognage', titre: 'Charognage', etat: 'charogne', texte: 'Un animal se nourrit sur une carcasse.' },
  { id: 'intimidation', titre: 'Intimidation', etat: 'menace', texte: 'Un prédateur vous fait face et gronde pour défendre sa place.' },
  { id: 'peche', titre: 'Pêche en vol', etat: 'peche', texte: 'Un ptérosaure rase l\'eau pour saisir un poisson.' },
  { id: 'premiereChasse', titre: 'Première proie', action: 'chasse', texte: 'Vous avez abattu une proie par vous-même.' },
];
