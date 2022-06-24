var selectedGeometry = {};
var $lastCheckedCell;
var territorySearchIndex = 0;
var ShapeLayerPreviewMap;
var CustomShapeMap;
var ShapeLayerBuilderPreviewShapeManager;
var CustomShapeLayerBuilderPreviewShapeManager;
var ShapeLayerBuilderPreviewMarkerArray = [];
var CustomShapeLayerBuilderPreviewMarkerArray = [];

var SEStatesDissolved = JSON.parse('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[-82.983386,24.602635],[-82.977736,24.656482],[-82.899928,24.717778],[-82.800177,24.726282],[-82.766681,24.66794],[-82.80441,24.604296],[-82.849053,24.576748],[-82.95816,24.581828],[-82.983386,24.602635]]],[[[-81.347015,30.712444],[-81.380867,30.627345],[-81.353574,30.44666],[-81.324877,30.424735],[-81.330627,30.299481],[-81.255134,30.000245],[-81.209268,29.875247],[-81.186399,29.76008],[-81.119814,29.59673],[-80.906836,29.144706],[-80.874815,29.105968],[-80.635573,28.750268],[-80.522973,28.608238],[-80.46939,28.453097],[-80.519428,28.391084],[-80.543999,28.271092],[-80.499773,28.07726],[-80.328113,27.750306],[-80.227962,27.463004],[-80.039102,27.029853],[-79.975425,26.80025],[-79.980648,26.595447],[-80.014362,26.362236],[-80.016904,26.257978],[-80.052257,25.974956],[-80.067685,25.902395],[-80.056056,25.837688],[-80.0965,25.652753],[-80.04351,25.598051],[-80.0567,25.555212],[-80.115671,25.541393],[-80.141757,25.434711],[-80.112612,25.375391],[-80.150013,25.31442],[-80.217862,25.295247],[-80.249773,25.179479],[-80.302899,25.144923],[-80.390435,25.057189],[-80.453365,24.963698],[-80.514343,24.940628],[-80.619896,24.854586],[-80.783375,24.76126],[-80.852228,24.748931],[-81.047648,24.64024],[-81.147686,24.649064],[-81.27169,24.597096],[-81.474733,24.553455],[-81.514615,24.564757],[-81.539924,24.486034],[-81.711831,24.429733],[-81.76287,24.449643],[-81.813522,24.417639],[-81.946441,24.399348],[-82.067171,24.523715],[-82.100333,24.499998],[-82.175098,24.499617],[-82.218964,24.54221],[-82.210239,24.590843],[-82.164692,24.629473],[-82.081731,24.635634],[-82.026643,24.607666],[-81.936739,24.656502],[-81.866423,24.663305],[-81.723528,24.725524],[-81.60277,24.799559],[-81.458887,24.86745],[-81.402473,24.881827],[-81.202322,24.868352],[-81.132429,24.805835],[-81.06447,24.791116],[-80.964288,24.819907],[-80.993976,24.910454],[-81.05511,24.971413],[-81.098489,25.066471],[-81.184409,25.125001],[-81.234044,25.234522],[-81.196077,25.357058],[-81.205709,25.410751],[-81.259117,25.479956],[-81.276004,25.535118],[-81.347231,25.636727],[-81.399194,25.659252],[-81.445143,25.737576],[-81.588095,25.809922],[-81.628669,25.771261],[-81.718139,25.793033],[-81.775286,25.880947],[-81.801041,25.973828],[-81.85034,26.062872],[-81.867882,26.214383],[-81.906149,26.331427],[-81.978126,26.399692],[-82.068898,26.371318],[-82.112221,26.377755],[-82.236453,26.4773],[-82.281846,26.61019],[-82.32191,26.665079],[-82.31793,26.734402],[-82.338319,26.803318],[-82.394753,26.875342],[-82.49982,27.043895],[-82.56474,27.2056],[-82.735158,27.415808],[-82.815377,27.535958],[-82.823669,27.575077],[-82.8057,27.709384],[-82.901337,27.839107],[-82.908909,27.890082],[-82.878105,28.04282],[-82.896633,28.080295],[-82.908311,28.206626],[-82.89215,28.245247],[-82.795276,28.299764],[-82.800268,28.354732],[-82.746195,28.44931],[-82.748738,28.532054],[-82.727392,28.595587],[-82.788007,28.709302],[-82.813037,28.791293],[-82.794786,28.857729],[-82.857828,28.942006],[-82.851278,29.017389],[-82.950078,29.076059],[-83.076,29.041819],[-83.14408,29.07284],[-83.171806,29.185921],[-83.233821,29.235728],[-83.238679,29.30861],[-83.297689,29.346075],[-83.36022,29.431083],[-83.449456,29.483351],[-83.46451,29.613319],[-83.544374,29.671453],[-83.609308,29.698416],[-83.647311,29.797139],[-83.745228,29.89382],[-83.808523,29.904346],[-84.043431,30.039755],[-84.109352,30.028084],[-84.184614,29.983069],[-84.251319,29.995969],[-84.256915,29.942848],[-84.298796,29.867126],[-84.338999,29.847125],[-84.44686,29.858732],[-84.512845,29.832042],[-84.542286,29.769797],[-84.639202,29.735214],[-84.73575,29.656375],[-84.927476,29.569628],[-85.031168,29.539088],[-85.234846,29.624999],[-85.292016,29.632273],[-85.381684,29.612853],[-85.429996,29.669967],[-85.474996,29.831542],[-85.446289,29.901033],[-85.505081,29.911781],[-85.587654,29.962518],[-85.632537,30.014255],[-85.767959,30.076404],[-85.826187,30.125185],[-85.947196,30.191446],[-86.18476,30.277966],[-86.397504,30.325354],[-86.645861,30.346173],[-86.908882,30.320226],[-87.138764,30.278493],[-87.296457,30.27269],[-87.518346,30.229506],[-87.647824,30.199211],[-87.807153,30.177378],[-88.003618,30.173417],[-88.074869,30.147149],[-88.162022,30.200093],[-88.384431,30.158543],[-88.425432,30.998323],[-88.451573,31.481531],[-88.473227,31.893856],[-88.428209,32.25103],[-88.354292,32.875131],[-88.294867,33.367103],[-88.210741,34.0292],[-88.135204,34.615878],[-88.097888,34.892202],[-88.152413,34.919741],[-88.200064,34.995634],[-88.202959,35.008028],[-87.429968,35.002791],[-86.836306,34.991899],[-86.467941,34.990486],[-85.605165,34.984678],[-85.379512,34.983035],[-84.952772,34.987943],[-84.321869,34.988408],[-83.619985,34.986592],[-83.108614,35.000659],[-82.784838,35.085699],[-82.763712,35.068209],[-82.641797,35.131817],[-82.431481,35.173187],[-82.419744,35.198613],[-82.27492,35.200071],[-81.686579,35.177658],[-81.069092,35.151242],[-81.03247,35.110033],[-81.041489,35.044703],[-80.93495,35.107409],[-80.782042,34.935785],[-80.797491,34.819752],[-80.164577,34.811656],[-79.6753,34.804744],[-79.358252,34.545579],[-79.201531,34.408634],[-78.874747,34.134395],[-78.499301,33.812852],[-78.635723,33.776679],[-78.772415,33.707967],[-78.887415,33.611975],[-78.993033,33.488992],[-79.034496,33.456834],[-79.087581,33.369287],[-79.120217,33.246932],[-79.086583,33.21531],[-79.091614,33.159056],[-79.140519,33.13962],[-79.215538,33.064248],[-79.273373,33.046559],[-79.322257,32.956078],[-79.440181,32.958916],[-79.495945,32.931572],[-79.534689,32.870012],[-79.637821,32.816377],[-79.691893,32.75924],[-79.760074,32.738257],[-79.798255,32.675632],[-79.918341,32.607264],[-79.979002,32.558074],[-80.088877,32.549029],[-80.121459,32.499192],[-80.198839,32.496241],[-80.243074,32.472449],[-80.374825,32.342453],[-80.392327,32.280317],[-80.523824,32.234592],[-80.584985,32.162589],[-80.66472,32.142607],[-80.748202,32.08449],[-80.751429,32.033468],[-80.789841,31.96439],[-80.855339,31.910809],[-80.938316,31.809008],[-80.970726,31.798353],[-81.049789,31.688633],[-81.087067,31.529158],[-81.190758,31.399876],[-81.172546,31.376831],[-81.18277,31.265846],[-81.234337,31.170258],[-81.296417,31.15188],[-81.297874,31.080952],[-81.345306,31.059362],[-81.304779,30.985712],[-81.400482,30.766426],[-81.347015,30.712444]]]]},"properties":{"type":"dissolved","label":"asdf","uniquelabel":"asdf","abbreviation":"","geoid":"","uniqueid":"","parentid":"","level":""}}]}');
var SEStatesNotDissolved = JSON.parse('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[-82.983386,24.602635],[-82.977736,24.656482],[-82.899928,24.717778],[-82.800177,24.726282],[-82.766681,24.66794],[-82.80441,24.604296],[-82.849053,24.576748],[-82.95816,24.581828],[-82.983386,24.602635]]],[[[-85.002499,31.000685],[-84.983527,30.935486],[-84.942525,30.888488],[-84.911122,30.751191],[-84.864693,30.711542],[-84.474409,30.692793],[-83.975655,30.67037],[-83.065223,30.620039],[-82.214677,30.568556],[-82.240403,30.53777],[-82.20124,30.485114],[-82.210733,30.42564],[-82.171623,30.359918],[-82.065598,30.358114],[-82.016906,30.475111],[-82.00581,30.565358],[-82.050217,30.674538],[-82.039795,30.747297],[-81.972458,30.779926],[-81.963928,30.8181],[-81.793968,30.787239],[-81.718109,30.744806],[-81.659805,30.751265],[-81.572395,30.721897],[-81.347015,30.712444],[-81.380867,30.627345],[-81.353574,30.44666],[-81.324877,30.424735],[-81.330627,30.299481],[-81.255134,30.000245],[-81.209268,29.875247],[-81.186399,29.76008],[-81.119814,29.59673],[-80.906836,29.144706],[-80.874815,29.105968],[-80.635573,28.750268],[-80.522973,28.608238],[-80.46939,28.453097],[-80.519428,28.391084],[-80.543999,28.271092],[-80.499773,28.07726],[-80.328113,27.750306],[-80.227962,27.463004],[-80.039102,27.029853],[-79.975425,26.80025],[-79.980648,26.595447],[-80.014362,26.362236],[-80.016904,26.257978],[-80.052257,25.974956],[-80.067685,25.902395],[-80.056056,25.837688],[-80.0965,25.652753],[-80.04351,25.598051],[-80.0567,25.555212],[-80.115671,25.541393],[-80.141757,25.434711],[-80.112612,25.375391],[-80.150013,25.31442],[-80.217862,25.295247],[-80.249773,25.179479],[-80.302899,25.144923],[-80.390435,25.057189],[-80.453365,24.963698],[-80.514343,24.940628],[-80.619896,24.854586],[-80.783375,24.76126],[-80.852228,24.748931],[-81.047648,24.64024],[-81.147686,24.649064],[-81.27169,24.597096],[-81.474733,24.553455],[-81.514615,24.564757],[-81.539924,24.486034],[-81.711831,24.429733],[-81.76287,24.449643],[-81.813522,24.417639],[-81.946441,24.399348],[-82.067171,24.523715],[-82.100333,24.499998],[-82.175098,24.499617],[-82.218964,24.54221],[-82.210239,24.590843],[-82.164692,24.629473],[-82.081731,24.635634],[-82.026643,24.607666],[-81.936739,24.656502],[-81.866423,24.663305],[-81.723528,24.725524],[-81.60277,24.799559],[-81.458887,24.86745],[-81.402473,24.881827],[-81.202322,24.868352],[-81.132429,24.805835],[-81.06447,24.791116],[-80.964288,24.819907],[-80.993976,24.910454],[-81.05511,24.971413],[-81.098489,25.066471],[-81.184409,25.125001],[-81.234044,25.234522],[-81.196077,25.357058],[-81.205709,25.410751],[-81.259117,25.479956],[-81.276004,25.535118],[-81.347231,25.636727],[-81.399194,25.659252],[-81.445143,25.737576],[-81.588095,25.809922],[-81.628669,25.771261],[-81.718139,25.793033],[-81.775286,25.880947],[-81.801041,25.973828],[-81.85034,26.062872],[-81.867882,26.214383],[-81.906149,26.331427],[-81.978126,26.399692],[-82.068898,26.371318],[-82.112221,26.377755],[-82.236453,26.4773],[-82.281846,26.61019],[-82.32191,26.665079],[-82.31793,26.734402],[-82.338319,26.803318],[-82.394753,26.875342],[-82.49982,27.043895],[-82.56474,27.2056],[-82.735158,27.415808],[-82.815377,27.535958],[-82.823669,27.575077],[-82.8057,27.709384],[-82.901337,27.839107],[-82.908909,27.890082],[-82.878105,28.04282],[-82.896633,28.080295],[-82.908311,28.206626],[-82.89215,28.245247],[-82.795276,28.299764],[-82.800268,28.354732],[-82.746195,28.44931],[-82.748738,28.532054],[-82.727392,28.595587],[-82.788007,28.709302],[-82.813037,28.791293],[-82.794786,28.857729],[-82.857828,28.942006],[-82.851278,29.017389],[-82.950078,29.076059],[-83.076,29.041819],[-83.14408,29.07284],[-83.171806,29.185921],[-83.233821,29.235728],[-83.238679,29.30861],[-83.297689,29.346075],[-83.36022,29.431083],[-83.449456,29.483351],[-83.46451,29.613319],[-83.544374,29.671453],[-83.609308,29.698416],[-83.647311,29.797139],[-83.745228,29.89382],[-83.808523,29.904346],[-84.043431,30.039755],[-84.109352,30.028084],[-84.184614,29.983069],[-84.251319,29.995969],[-84.256915,29.942848],[-84.298796,29.867126],[-84.338999,29.847125],[-84.44686,29.858732],[-84.512845,29.832042],[-84.542286,29.769797],[-84.639202,29.735214],[-84.73575,29.656375],[-84.927476,29.569628],[-85.031168,29.539088],[-85.234846,29.624999],[-85.292016,29.632273],[-85.381684,29.612853],[-85.429996,29.669967],[-85.474996,29.831542],[-85.446289,29.901033],[-85.505081,29.911781],[-85.587654,29.962518],[-85.632537,30.014255],[-85.767959,30.076404],[-85.826187,30.125185],[-85.947196,30.191446],[-86.18476,30.277966],[-86.397504,30.325354],[-86.645861,30.346173],[-86.908882,30.320226],[-87.138764,30.278493],[-87.296457,30.27269],[-87.518346,30.229506],[-87.49998,30.328957],[-87.450778,30.346999],[-87.440678,30.391498],[-87.369383,30.431948],[-87.435578,30.480496],[-87.445103,30.528909],[-87.393294,30.627218],[-87.406356,30.674437],[-87.501502,30.721092],[-87.544789,30.778395],[-87.626224,30.846664],[-87.588862,30.96579],[-87.598829,30.997455],[-87.140755,30.999532],[-86.704483,30.994668],[-86.12154,30.992884],[-85.568112,30.996244],[-85.002499,31.000685]]]]},"properties":{"type":"Administrative","label":"Florida","uniquelabel":"Florida","abbreviation":"FL","geoid":"12","uniqueid":"USA-12","parentid":"","level":"1"}},{"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[-85.605165,34.984678],[-85.379512,34.983035],[-84.952772,34.987943],[-84.321869,34.988408],[-83.619985,34.986592],[-83.108614,35.000659],[-83.127357,34.950195],[-83.32415,34.787479],[-83.352692,34.716904],[-83.23258,34.611597],[-83.168278,34.590998],[-83.034565,34.483571],[-82.901551,34.486764],[-82.8644,34.459785],[-82.833571,34.364092],[-82.798658,34.341777],[-82.743172,34.251598],[-82.717459,34.150546],[-82.675219,34.129779],[-82.593887,34.028109],[-82.556765,33.945324],[-82.422808,33.863757],[-82.346933,33.834298],[-82.247472,33.752591],[-82.196584,33.630583],[-82.133523,33.590535],[-82.046335,33.56383],[-81.985938,33.486536],[-81.934136,33.468337],[-81.918337,33.332842],[-81.847736,33.307243],[-81.852822,33.248542],[-81.756935,33.197848],[-81.768235,33.167949],[-81.704634,33.11645],[-81.614994,33.095551],[-81.491899,33.006694],[-81.502716,32.938688],[-81.457061,32.850389],[-81.426475,32.840773],[-81.411839,32.762147],[-81.427505,32.702242],[-81.393033,32.651542],[-81.389205,32.595416],[-81.299796,32.563049],[-81.200408,32.468314],[-81.205572,32.423893],[-81.119784,32.286368],[-81.15577,32.245793],[-81.118237,32.189203],[-81.117225,32.117604],[-81.066965,32.090384],[-81.01197,32.100178],[-80.926769,32.041663],[-80.751429,32.033468],[-80.789841,31.96439],[-80.855339,31.910809],[-80.938316,31.809008],[-80.970726,31.798353],[-81.049789,31.688633],[-81.087067,31.529158],[-81.190758,31.399876],[-81.172546,31.376831],[-81.18277,31.265846],[-81.234337,31.170258],[-81.296417,31.15188],[-81.297874,31.080952],[-81.345306,31.059362],[-81.304779,30.985712],[-81.400482,30.766426],[-81.347015,30.712444],[-81.572395,30.721897],[-81.659805,30.751265],[-81.718109,30.744806],[-81.793968,30.787239],[-81.963928,30.8181],[-81.972458,30.779926],[-82.039795,30.747297],[-82.050217,30.674538],[-82.00581,30.565358],[-82.016906,30.475111],[-82.065598,30.358114],[-82.171623,30.359918],[-82.210733,30.42564],[-82.20124,30.485114],[-82.240403,30.53777],[-82.214677,30.568556],[-83.065223,30.620039],[-83.975655,30.67037],[-84.474409,30.692793],[-84.864693,30.711542],[-84.911122,30.751191],[-84.942525,30.888488],[-84.983527,30.935486],[-85.002499,31.000685],[-85.037062,31.109753],[-85.099647,31.164942],[-85.113261,31.264343],[-85.071621,31.468384],[-85.041428,31.539293],[-85.057473,31.618624],[-85.12593,31.696265],[-85.140731,31.857461],[-85.08213,31.944658],[-85.045063,32.088063],[-85.06206,32.132486],[-85.009224,32.181646],[-84.930727,32.21895],[-84.901191,32.258374],[-84.9338,32.29826],[-85.002791,32.322428],[-84.971831,32.442843],[-85.001532,32.514741],[-85.067199,32.579306],[-85.105437,32.644934],[-85.122326,32.774383],[-85.165635,32.808222],[-85.184737,32.870514],[-85.304439,33.482884],[-85.406748,34.002314],[-85.47045,34.328239],[-85.561416,34.750079],[-85.605165,34.984678]]]]},"properties":{"type":"Administrative","label":"Georgia","uniquelabel":"Georgia","abbreviation":"GA","geoid":"13","uniqueid":"USA-13","parentid":"","level":"1"}},{"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[-88.200064,34.995634],[-88.202959,35.008028],[-87.429968,35.002791],[-86.836306,34.991899],[-86.467941,34.990486],[-85.605165,34.984678],[-85.561416,34.750079],[-85.47045,34.328239],[-85.406748,34.002314],[-85.304439,33.482884],[-85.184737,32.870514],[-85.165635,32.808222],[-85.122326,32.774383],[-85.105437,32.644934],[-85.067199,32.579306],[-85.001532,32.514741],[-84.971831,32.442843],[-85.002791,32.322428],[-84.9338,32.29826],[-84.901191,32.258374],[-84.930727,32.21895],[-85.009224,32.181646],[-85.06206,32.132486],[-85.045063,32.088063],[-85.08213,31.944658],[-85.140731,31.857461],[-85.12593,31.696265],[-85.057473,31.618624],[-85.041428,31.539293],[-85.071621,31.468384],[-85.113261,31.264343],[-85.099647,31.164942],[-85.037062,31.109753],[-85.002499,31.000685],[-85.568112,30.996244],[-86.12154,30.992884],[-86.704483,30.994668],[-87.140755,30.999532],[-87.598829,30.997455],[-87.588862,30.96579],[-87.626224,30.846664],[-87.544789,30.778395],[-87.501502,30.721092],[-87.406356,30.674437],[-87.393294,30.627218],[-87.445103,30.528909],[-87.435578,30.480496],[-87.369383,30.431948],[-87.440678,30.391498],[-87.450778,30.346999],[-87.49998,30.328957],[-87.518346,30.229506],[-87.647824,30.199211],[-87.807153,30.177378],[-88.003618,30.173417],[-88.074869,30.147149],[-88.162022,30.200093],[-88.384431,30.158543],[-88.425432,30.998323],[-88.451573,31.481531],[-88.473227,31.893856],[-88.428209,32.25103],[-88.354292,32.875131],[-88.294867,33.367103],[-88.210741,34.0292],[-88.135204,34.615878],[-88.097888,34.892202],[-88.152413,34.919741],[-88.200064,34.995634]]]]},"properties":{"type":"Administrative","label":"Alabama","uniquelabel":"Alabama","abbreviation":"AL","geoid":"01","uniqueid":"USA-01","parentid":"","level":"1"}},{"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[-83.108614,35.000659],[-82.784838,35.085699],[-82.763712,35.068209],[-82.641797,35.131817],[-82.431481,35.173187],[-82.419744,35.198613],[-82.27492,35.200071],[-81.686579,35.177658],[-81.069092,35.151242],[-81.03247,35.110033],[-81.041489,35.044703],[-80.93495,35.107409],[-80.782042,34.935785],[-80.797491,34.819752],[-80.164577,34.811656],[-79.6753,34.804744],[-79.358252,34.545579],[-79.201531,34.408634],[-78.874747,34.134395],[-78.499301,33.812852],[-78.635723,33.776679],[-78.772415,33.707967],[-78.887415,33.611975],[-78.993033,33.488992],[-79.034496,33.456834],[-79.087581,33.369287],[-79.120217,33.246932],[-79.086583,33.21531],[-79.091614,33.159056],[-79.140519,33.13962],[-79.215538,33.064248],[-79.273373,33.046559],[-79.322257,32.956078],[-79.440181,32.958916],[-79.495945,32.931572],[-79.534689,32.870012],[-79.637821,32.816377],[-79.691893,32.75924],[-79.760074,32.738257],[-79.798255,32.675632],[-79.918341,32.607264],[-79.979002,32.558074],[-80.088877,32.549029],[-80.121459,32.499192],[-80.198839,32.496241],[-80.243074,32.472449],[-80.374825,32.342453],[-80.392327,32.280317],[-80.523824,32.234592],[-80.584985,32.162589],[-80.66472,32.142607],[-80.748202,32.08449],[-80.751429,32.033468],[-80.926769,32.041663],[-81.01197,32.100178],[-81.066965,32.090384],[-81.117225,32.117604],[-81.118237,32.189203],[-81.15577,32.245793],[-81.119784,32.286368],[-81.205572,32.423893],[-81.200408,32.468314],[-81.299796,32.563049],[-81.389205,32.595416],[-81.393033,32.651542],[-81.427505,32.702242],[-81.411839,32.762147],[-81.426475,32.840773],[-81.457061,32.850389],[-81.502716,32.938688],[-81.491899,33.006694],[-81.614994,33.095551],[-81.704634,33.11645],[-81.768235,33.167949],[-81.756935,33.197848],[-81.852822,33.248542],[-81.847736,33.307243],[-81.918337,33.332842],[-81.934136,33.468337],[-81.985938,33.486536],[-82.046335,33.56383],[-82.133523,33.590535],[-82.196584,33.630583],[-82.247472,33.752591],[-82.346933,33.834298],[-82.422808,33.863757],[-82.556765,33.945324],[-82.593887,34.028109],[-82.675219,34.129779],[-82.717459,34.150546],[-82.743172,34.251598],[-82.798658,34.341777],[-82.833571,34.364092],[-82.8644,34.459785],[-82.901551,34.486764],[-83.034565,34.483571],[-83.168278,34.590998],[-83.23258,34.611597],[-83.352692,34.716904],[-83.32415,34.787479],[-83.127357,34.950195],[-83.108614,35.000659]]]]},"properties":{"type":"Administrative","label":"South Carolina","uniquelabel":"South Carolina","abbreviation":"SC","geoid":"45","uniqueid":"USA-45","parentid":"","level":"1"}}]}');
//start shape layer variable
var MAShapeLayer = {
    NeedMarkerBoundingEvents: false,
    ZoomOrDragEvent: function (e)  {

        if (MAShapeLayer.NeedMarkerBoundingEvents)
        {

            $('#PlottedQueriesTable .PlottedShapeLayer').each(function () {
            	var $layer = $(this);

            	//are labels enabled?
            	var markerLabels = $layer.find('#toggle-labels').attr('checked') == 'checked';

            	if ($layer.data('labelmarkers') && markerLabels)
            	{
            	    var zoom = MA.map.getZoom();
            		var markers = $layer.data('labelmarkers');

            		for (i = 0; i < markers.length; i++)
            		{

                        var NewVisibleSetting = (zoom >= 9 && MA.map.getBounds().contains(markers[i].getPosition()));
                        var ExistingVisibleSetting = markers[i].getVisible();


                        if (NewVisibleSetting != ExistingVisibleSetting)
                        {
                            if($layer.find('#toggle-dissolve').is(':checked')) {
                            	markers[i].setVisible(true);
                            }
                            else {
                            	markers[i].setVisible(NewVisibleSetting);
                            }
                        }
                    }

            	}
            });


        }


    },
    UpdateNeedMarkerBoundingEvents: function() {
        MAShapeLayer.NeedMarkerBoundingEvents = false;

        $('#PlottedQueriesTable .PlottedShapeLayer').each(function () {
        	var $layer = $(this);

        	if ($layer.data('labelmarkers'))
        	{
        		if ($layer.data('labelmarkers').length > 500)
        		{
        			MAShapeLayer.NeedMarkerBoundingEvents = true;
        		}

        	}
        });
    },
    buildShapeActionButtons: function(options) {
        options = options || {};
        if (options.buttonSettings) {
            var result = '';

            if (MA.isMobile) {
                MAShapeLayer.buildMobileShapeActionButtons(options);
            }
            else {
                var massActionLayout = MA.getProperty(options, 'buttonSettings.massActionLayout');

                if (Array.isArray(massActionLayout)) {
                    var $shapeActionsWrappper = $('#shapeTooltipTemplates').clone().attr('id', '')
                        .find('#shapeActionsWrappper').clone().attr('id', '');

                    massActionLayout.forEach(function(section) {
                        var sectionLabel = MA.getProperty(section, 'Label') || 'Actions';

                        var $buttonSection = $($('#shapeTooltipTemplates').clone().attr('id', '')
                            .find('#buttonSection').clone().attr('id', '').html().replace('::sectionLabel::', htmlEncode(sectionLabel)));

                        var buttons = MA.getProperty(section, 'Buttons');

                        if (Array.isArray(buttons)) {
                            MA.Util.createBatchable(buttons, 3).forEach(function(buttonGroup) {
                                var $buttonsColumn = $($('#shapeTooltipTemplates').clone().attr('id', '')
                                    .find('#buttonSectionColumn').clone().attr('id', '').html());

                                if (Array.isArray(buttonGroup)) {
                                    buttonGroup.forEach(function(button) {
                                        var buttonDefinition = {};
                                        if (button.Type == 'Custom Action' && MAActionFramework.customActions[button.Label]) {
                                            $.extend(buttonDefinition, MAActionFramework.customActions[button.Label]);
                                        }
                                        else if (MAActionFramework.standardActions[button.Action || button.Label]) {
                                            $.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
                                        }
                                        var buttonLabel = MA.getProperty(buttonDefinition, 'Label', false);
                                        var buttonType = MA.getProperty(button, 'Type', false);
                                        var buttonAction = MA.getProperty(button,'Label', false);
                                        var $actionButton = $($('#shapeTooltipTemplates').clone().attr('id', '')
                                            .find('#actionButton').clone().attr('id', '').html()
                                            .replace('::layerId::', options.layerId)
                                            .replace('::action::', buttonAction || buttonLabel)
                                            .replace('::buttonLabel::', htmlEncode(buttonLabel))
                                            .replace('::action-type::', buttonType));

                                        //  action button click handler
                                        $actionButton.attr('onclick', 'MAShapeLayer.shapeActionClick(this)');

                                        $buttonsColumn.append($actionButton);
                                    });
                                }
                                
                                $buttonSection.find('.buttonset-section-columns').append($buttonsColumn);
                            });
                        }

                        $shapeActionsWrappper.find('.button-sections').append($buttonSection);
                    });

                    result = { markup: $shapeActionsWrappper.html() };
                }
            }

            return result;
        }
    },
    buildMobileShapeActionButtons: function(options) {
        $('#shapeActionSheet .ma-action-sheet').empty();
        $('#shapeActionsWrapper .action-bar-wrap').empty();

        // populate mobile shape tooltip actions
        var actionButtons = [];
        var massActionLayout = MA.getProperty(userSettings, 'ButtonSetSettings.massActionLayout');

        if (massActionLayout) {
            massActionLayout.forEach(function(layout) {
                actionButtons = actionButtons.concat(layout.Buttons);
            });  
        }
        var actions = [];
        $.each(actionButtons,function(i,button){
            var buttonDefinition = {};
            if (button.Type == 'Custom Action' && MAActionFramework.customActions[button.Label]) {
				jQuery.extend(buttonDefinition, MAActionFramework.customActions[button.Label]);

				//disable Iframe on nearby for now
				var ActionType = MAActionFramework.customActions[button.Label].Action;
				if(MA.IsMobile && ActionType == 'Iframe') {
					return;
				}
			}
			else if (MAActionFramework.standardActions[button.Action || button.Label]) {
				if(options && options.mode == 'NearBy') {
					var modes = MAActionFramework.standardActions[button.Action || button.Label].Modes;
					if($.inArray('NearBy',modes) >= 0) {
						jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
					}
				}
				else {
					jQuery.extend(buttonDefinition, MAActionFramework.standardActions[button.Action || button.Label]);
				}
			}
			else {
				return;
			}         
			var actButton = {
				label : buttonDefinition.Label,
				type : buttonDefinition.Type,
				action : button.Label,
				header : false,
				icon : button.icon || buttonDefinition.defaultIcon
            }
			//validate that this button meets mode requirements.  if it doesn't then disable it
			if (MA.IsMobile && jQuery.inArray('Mobile', buttonDefinition.Modes) == -1) {
				actButton['disabled'] = true;
				//ActionsArr.push(actButton);
				return;
			}
							
			//validate that this button meets render type requirements
			if (buttonDefinition.RenderModes && jQuery.inArray(options.markerType, buttonDefinition.RenderModes) == -1 && buttonDefinition.Label != MASystem.Labels.MAActionFramework_Set_Verified_Location) {
				actButton['disabled'] = true;
				//return false;
			}

			if(!actButton.disabled) {
				actions.push(actButton);
			}
			
			if(actions.length < 4) {
                var $customButton = $('<button class="action-bar-button actionbutton"></button>');
                
                var $label = $('<span>' + buttonDefinition.Label + '</span>');
        
                $customButton.attr('data-action', button.Action || button.Label);
                $customButton.attr('data-action-type', buttonDefinition.Type);
                $customButton.attr('data-layerid', options.layerId);
                $customButton.attr('data-type', options.Type);
                $customButton.attr('data-marker', 'record');

                var $icon = $('<div></div>');
                var icon = MA.getProperty(MAActionFramework, ['standardActions', button.Label, 'defaultIcon']) || MA.getProperty(MAActionFramework, ['customActions', button.Label, 'defaultIcon']) || 'ma-icon-solution';
                $icon.addClass(['ma-icon', icon].join(' '));
                $customButton.append($icon);
                $customButton.append($label);

                $customButton.click(function() { MAShapeLayer.shapeActionClick(this); });

                $('#shapeActionsWrapper .action-bar-wrap').append($customButton);
			} else {
				if(actions.length == 5) {
					var hamburgerMenuMarkup = '<button class="action-bar-button open-marker-action-sheet open-action-sheet" action-sheet="shapeActionSheet">' +
					'<div class="ma-icon ma-icon-threedots-vertical"></div>' +
					'</button>';

					$('#shapeActionsWrapper .action-bar-wrap').append($(hamburgerMenuMarkup));
				}			
            
				var $customButton = $('<div class="ma-action-sheet-item actionbutton">' + buttonDefinition.Label + '</div>');

				$customButton.attr('data-action', button.Action || button.Label);
				$customButton.attr('data-action-type', buttonDefinition.Type);
				$customButton.attr('data-layerid', options.layerId);
				$customButton.attr('data-type', options.Type);
				$customButton.attr('data-marker', 'record');

				$customButton.click(function() { MAShapeLayer.shapeActionClick(this); });

				$('#shapeActionSheet .ma-action-sheet').append($customButton);
				
			}
        });
		 $('#shapeActionSheet').data('actionOptions', $.extend(options.options, {
            geometry: options.geometry
        }));


    },
    shapeActionClick: function(target) {
        var action = $(target).attr('data-action');
        var actionType = $(target).attr('data-action-type');
        var actionOptions = $('#shapeInfoPopup').data('massActionInfo');
        
        if (actionOptions) {
            if (actionOptions.type === 'cluster') {
                massActionClick(action, actionType, actionOptions);
            } else {
                var options = {
                    shape: {
                        geometry: actionOptions.geometry
                    }
                };
                massActionShapeClick(actionOptions.target, action, actionType, options);
            }
        } else {
            MAToastMessages.showWarning({message: 'No action taken.', subMessage: 'No markers found that support this action.', timeOut: 10000});
            console.warn('Action options for this shape action not found');
        }
    },
    saveShape: function(options) {
        var $dfd = $.Deferred();

        options = options || {};
        
        if (MA.isMobile) {
            var shapeLayerName = MA.getProperty(options, 'shapeLayerName');
            var shapeLayerDescription = MA.getProperty(options, 'shapeLayerDescription');
            var folderId = MA.getProperty(options, 'folderId');
            var shapeInfo = MA.getProperty(options, 'shapeInfo');

            // for Personal Folder, set the User Id to save folder for
            var userId = folderId == 'PersonalRoot' ? MA.getProperty(MA, 'CurrentUser.Id') : null;
            
            // handle PersonalRoot and Corporate Root folder selections
            if (folderId === 'PersonalRoot') {
                folderId = null;
                userId = MA.getProperty(MA, 'CurrentUser.Id');
            } else if (folderId === 'CorporateRoot') {
                folderId = null;
                userId = null;
            }

            var isDrawnShape = MA.getProperty(options, 'shapeInfo.custom');

            if (isDrawnShape) {
                var shape = MA.getProperty(shapeInfo, 'shape');

                var colorOpts = {
                    fillColor: "#22CC22",
                    borderColor: "#000000",
                    fillOpacity: "0.2",
                    labelEnabled: false,
                    labelOverride: "",
                    labelJustification: "center",
                    labelFontSize: "10px",
                    labelFontColor:"#FFFFFF",
                    labelBGColor: "#000000",
                    labelBGOpacity: "0.3"
                };

                var territoryOptions = {
                    country: 'USA',
                    advancedOptions: { 
                        calculateTerritoryAggregates: false,
                        dissolveGeometry: true
                    },
                    colorOptions: colorOpts
                };

                var points = [];

                shape.getPath().getArray().forEach(function(point) {
                    points.push(point.toJSON());
                });

                var shapeData = {
                    proximityType: 'Polygon',
                    isCustom: true,
                    points: points
                };

                var territory = {
                    Id: null,
                    Name: shapeLayerName,
                    sma__Description__c: shapeLayerDescription,
                    sma__User__c : userId || null,
                    sma__Folder__c : folderId || null,
                    sma__Options__c : JSON.stringify(territoryOptions),
                    sma__CustomGeometry__c : true
                };

                var serializedGeometry = {
                    Name : shapeLayerName + '-geometry',
                    sma__Geometry__c : JSON.stringify(shapeData)
                };

                var processData = {
                    action: 'saveBoundaryInfo',
                    ajaxResource: 'MATerritoryAJAXResources',
                    serializedTerritory: JSON.stringify(territory),
                    serializedGeometry: JSON.stringify(serializedGeometry)
                };

                // Save shape layer
                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest, processData, function(res, event) {
                    if (event.status) {
                        if (res && res.success) {
                            $dfd.resolve(res);
                        } else {
                            $dfd.reject(res);
                        }
                    } else {
                        $dfd.reject({ message: 'Remote call error', error: event });
                    }
                });
            } else {
                $dfd.reject('Save shape function currently only supports saving custom drawn shapes');
            }
        } else {
            $dfd.reject('Save shape function currently only supports mobile');
        }

        return $dfd.promise();
    }
} //End MAShapeLayer Object

var MACustomShapes = {
    currentLayer : [],
    shapeData : null,
    shapeType : '',
    openPopupSidebar : function (options) {
        options = $.extend({
            isParcel : false,
            isKML : false,
            id : '',
            isClone: false
        },options || {});
        var $customShapePopup = $('#CustomShapePopup');
            $customShapePopup.data('isClone',options.isClone);
        
        $customShapePopup.find('.labelOptions').show();
        //show popup
        // LaunchPopupWindow($('#CustomShapePopup'), 900);
        MALayers.showModal('CustomShapePopup');
        //reset the data
        clearCustomShapeInfo();
        var folderId = '';

        if(options.isParcel) {
            $customShapePopup.find('.shape-name').val(options.label);
            $customShapePopup.data('parcelData',options);
            $customShapePopup.find('.labelOptions').hide();
        }
        else if (options.isKML) {
            $customShapePopup.data('kmlData',options);
            $customShapePopup.find("#tabs" ).tabs({
              disabled: [ 2 ]
            });
            $customShapePopup.find("#tabs" ).tabs( "option", "active", 0);
        }
        else if(options.shape) {
            var shape = options.shape;
            //find the shapeLayer in the sidebar
            this.currentLayer = $('#PlottedQueriesTable .PlottedShapeLayer[qid="'+shape.qid+'"]');

            this.currentShapeId = shape.qid;
            //determine the type of shape and store the data
            this.buildShapeData(shape);

            //set the colors if this is a polygon or rect
            if(this.shapeData.proximityType == 'Polygon') {
                $customShapePopup.find('.fillcolor')[0].color.fromString('#22CC22');
                $customShapePopup.find('.bordercolor')[0].color.fromString('#000000');
            }
            else if(this.shapeData.proximityType == 'Rectangle') {
                $customShapePopup.find('.fillcolor')[0].color.fromString('#FFCC66');
                $customShapePopup.find('.bordercolor')[0].color.fromString('#000000');
            }

            var $shapeLayer = this.currentLayer;
            if($shapeLayer.data('territoryData')) {
                var terData = removeNamespace(MASystem.MergeFields.NameSpace, $shapeLayer.data('territoryData'));
                $customShapePopup.data('territoryData',terData);
                var options = JSON.parse(terData.Options__c);
                var colorOptions = options.colorOptions;
                folderId = terData.Folder__c;
                $customShapePopup.find('.shape-name').val(terData.Name);
                $customShapePopup.find('.shape-description').val(terData.Description__c);

                try{$customShapePopup.find('.fillcolor')[0].color.fromString(colorOptions.fillColor);}catch(e){}
                try{$customShapePopup.find('.bordercolor')[0].color.fromString(colorOptions.borderColor);}catch(e){}
                $customShapePopup.find('.fillopacity').val(colorOptions.fillOpacity);
                $customShapePopup.find('#custom-shapelayer-label-enabled').prop('checked',colorOptions.labelEnabled);
                $customShapePopup.find('.label-text-override-input').val(colorOptions.labelOverride);
                $customShapePopup.find('#custom-shapelayer-label-justification').val(colorOptions.labelJustification);
                $customShapePopup.find('#custom-shapelayer-label-font-size').val(colorOptions.labelFontSize);
                $customShapePopup.find('#custom-shapelayer-label-font-color').val(colorOptions.labelFontColor);
                try{$customShapePopup.find('#custom-shapelayer-label-bg-color')[0].color.fromString(colorOptions.labelBGColor);}catch(e){}
                try{$customShapePopup.find('#custom-shapelayer-label-bg-opacity')[0].color.fromString(colorOptions.labelFontColor);}catch(e){}

                $customShapePopup.find("#tabs" ).tabs({
                  disabled: [ 1 ]
                });
                $customShapePopup.find("#tabs" ).tabs( "option", "active", 2 );
            }

            $customShapePopup.data('shape',shape);
            $customShapePopup.data('territoryData',$shapeLayer.data('territoryData'));
        }
        else {
            this.currentLayer = [];

            //get the info and open options
            MACustomShapes.getShapeInfo({id : options.id}).then(function(response) {
                if(response.success) {
                    var terData = removeNamespace(MASystem.MergeFields.NameSpace, response.data.territory);
                    folderId = terData.Folder__c;
                    $customShapePopup.data('territoryData',terData);
                    var terOptions = JSON.parse(terData.Options__c);
                    var colorOptions = terOptions.colorOptions;

                    //check if this is a parcel
                    var geoInfo = terData.Geometries__r || {};
                    var geoRecords = geoInfo.records || [];
                    var geoRecord = removeNamespace(MASystem.MergeFields.NameSpace,geoRecords[0]) || {};
                    var geoGeometry = geoRecord.Geometry__c || '{}';
                    var geoJson = JSON.parse(geoGeometry);

                    if(geoJson.isParcel) {
                        $('#CustomShapePopup .labelOptions').hide();
                        $customShapePopup.removeData('territoryData');
                        $customShapePopup.data('savedParcelData',terData);
                    }

                    try{$('#CustomShapePopup .fillcolor')[0].color.fromString(colorOptions.fillColor);}catch(e){}
                    try{$('#CustomShapePopup .bordercolor')[0].color.fromString(colorOptions.borderColor);}catch(e){}
                    $('#CustomShapePopup .fillopacity').val(colorOptions.fillOpacity);
                    $('#CustomShapePopup #custom-shapelayer-label-enabled').prop('checked',colorOptions.labelEnabled);
                    $('#CustomShapePopup .label-text-override-input').val(colorOptions.labelOverride);
                    $('#CustomShapePopup #custom-shapelayer-label-justification').val(colorOptions.labelJustification);
                    $('#CustomShapePopup #custom-shapelayer-label-font-size').val(colorOptions.labelFontSize);
                    $('#CustomShapePopup #custom-shapelayer-label-font-color').val(colorOptions.labelFontColor);
                    try{$('#CustomShapePopup #custom-shapelayer-label-bg-color')[0].color.fromString(colorOptions.labelBGColor);}catch(e){}
                    try{$('#CustomShapePopup #custom-shapelayer-label-bg-opacity')[0].color.fromString(colorOptions.labelFontColor);}catch(e){}

                    if(geoJson.proximityType === 'KML') {
                        //$('#CustomShapePopup #tabs').hide();
                        $('#CustomShapePopup').addClass('isKML');
                        $( "#CustomShapePopup #tabs" ).tabs({
                            disabled: [ 1,2 ]
                        });
                    }
                    else {
                        $( "#CustomShapePopup #tabs" ).tabs({
                          disabled: [ 1 ]
                        });
                        $( "#CustomShapePopup #tabs" ).tabs( "option", "active", 1 );
                    }
                    
                    var terName = terData.Name;
                    
                    if(options.isClone)
                    {
                        terName = 'Copy of ' + terName
                        $('#CustomShapePopup').data('isClone',options.isClone);
                    }
                    
                    $('#CustomShapePopup .shape-name').val(terName);
                    $('#CustomShapePopup .shape-description').val(terData.Description__c);



                }
                else {
                    MA.log(response);
                }
            });
        }

        //Initialize Folder tree for Copy To
        $("#SaveShapeTree")

            .jstree({
                "json_data" : {
                    "data": "",
                    "ajax" : {
                        "url" : MA.resources.TreeXML,
                        "data" : function (n) {
                            return {
                                id : n.attr ? n.attr("id") : 0,
                                rand : new Date().getTime(),
                                type: n.attr ? n.attr("NodeType") : 0,
                                types: 'Folder'
                            };
                        },
                        "error" : function(e,b,d) {
                            MA.log('Unable to load folders.','Please check if user has access to MapAnythingTree2.page');
                            MAToastMessages.showError({message:'Unable to load folder structure to save shape.',subMessage:'Please check your permission...',timeOut:7000});
                        }
                    }
                },
                "core": {
                    "animation" : 10,
                    "strings":
                        {
                            "loading" : "Loading...",
                            "new_node" : "New Folder"
                        }

                },
                "plugins" : ["themes","json_data","ui","crrm","types"]

            })

            .on('load_node.jstree load_node_json.jstree', function () {
                $('#SaveShapeTree li').each(function () {
                    var $li = $(this);
                    if (!MASystem.User.IsCorporateAdmin && (($li.attr('nodetype') == 'CorporateRoot' && $li.attr('create') != 'true') || ($li.attr('nodetype') == 'CorporateFolder' && $li.attr('create') != 'true'))) {
                        $(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
                    }
                    else if ($(this).attr('nodetype') == 'RoleRoot' || $(this).attr('nodetype') == 'RoleNameFolder') {
                        $(this).addClass('disabled').find('> a > .jstree-checkbox').addClass('copyto-disabled');
                    }

                    if(folderId == $li.attr('id')) {
                        $li.addClass('selected');
                    }
                });
            })

            .bind("select_node.jstree", function (e, data) {
                var node = data.rslt.obj;
                $('#SaveShapeTree li').removeClass('selected');
                node.addClass('selected');
            })

        ; //End jstree

    },

    saveV2 : function (plot) {
        var update = false;
        var userId;
        var folderId;
        var territoryId;

        //find the shapeLayer in the sidebar
        var $shapeLayer = MACustomShapes.currentLayer;

        $('#CustomShapePopup .maPopupLoading').removeClass('hidden');
        if(MACustomShapes.currentLayer.length > 0) {
            var terData = $shapeLayer.data('territoryData');
            territoryId = terData.Id;
            folderId = terData.Folder__c;
            userId = terData.User__c;
            update = true;
        }
        else if ($('#CustomShapePopup').data('territoryData')){
            var terData = $('#CustomShapePopup').data('territoryData');
            var isClone = $('#CustomShapePopup').data('isClone');
            territoryId = isClone != true ? terData.Id : null;
            folderId = terData.Folder__c;
            userId = terData.User__c;
            update = true;
        }
        else if ($('#CustomShapePopup').data('savedParcelData')){
            var parcelData = $('#CustomShapePopup').data('savedParcelData');
            territoryId = parcelData.Id;
            folderId = parcelData.Folder__c;
            userId = parcelData.User__c;
            update = true;
        }
        else if ($('#CustomShapePopup').data('savedkmlData')) {
            var kmlData = $('#CustomShapePopup').data('savedkmlData');
            territoryId = kmlData.Id;
            folderId = kmlData.Folder__c;
            userId = kmlData.User__c;
            update = true;
        }

        //check if name and folder
        if(!update) {
            var node = $('#SaveShapeTree').jstree('get_selected');
            if(node.length == 0) {
                //show warning message
                showError($('#CustomShapePopup'), 'Please select a folder.');
                $('#CustomShapePopup .maPopupLoading').addClass('hidden');
                return;
            }

            //determine the folder
            if(node.attr('nodetype') == 'PersonalRoot') {
                userId = MA.CurrentUser.Id
            }
            else if(node.attr('nodetype') == 'CorporateRoot') {
                if (!MASystem.User.IsCorporateAdmin && (node.attr('nodetype') == 'CorporateRoot' || (node.attr('nodetype') == 'CorporateFolder' && node.attr('create') != 'true'))) {
                    showError($('#CustomShapePopup'), 'You do not have permissions to save to this folder');
                    $('#CustomShapePopup .maPopupLoading').addClass('hidden');
                    return;
                    //$(this).remove();
            }
                //do nothing
            }
            else {
                folderId = node.attr('id');
            }
        }

        //get the name
        var name = $('#CustomShapePopup .shape-name').val();
        if(name == '') {
            //show warning message
            showError($('#CustomShapePopup'), 'Please enter a name.');
            $('#CustomShapePopup .maPopupLoading').addClass('hidden');
            return;
        }

        //check if the folder id was changed


        var shape = $('#CustomShapePopup').data('shape');

        //create the shapedata
        if(shape != null && shape != undefined) {
            this.buildShapeData(shape);
        }
        else if ($('#CustomShapePopup').data('territoryData')) {
            var terData = $('#CustomShapePopup').data('territoryData');
            var geometries = terData.Geometries__r.records || [];
            MACustomShapes.shapeData = [];
            for(var i = 0; i < geometries.length; i++) {
                var geo = removeNamespace(MASystem.MergeFields.NameSpace,geometries[i]);
                MACustomShapes.shapeData.push(JSON.parse(geo.Geometry__c));
            }
        }
        else if ($('#CustomShapePopup').data('savedParcelData')) {
            var parcelData = $('#CustomShapePopup').data('savedParcelData');
            var geometries = parcelData.Geometries__r.records || [];
            MACustomShapes.shapeData = [];
            for(var i = 0; i < geometries.length; i++) {
                var geo = removeNamespace(MASystem.MergeFields.NameSpace,geometries[i]);
                MACustomShapes.shapeData.push(JSON.parse(geo.Geometry__c));
            }
        }
        else if ($('#CustomShapePopup').data('savedkmlData')) {
            var KMLData = $('#CustomShapePopup').data('savedkmlData');
            var geometries = KMLData.Geometries__r.records || [];
            MACustomShapes.shapeData = [];
            for(var i = 0; i < geometries.length; i++) {
                var geo = removeNamespace(MASystem.MergeFields.NameSpace,geometries[i]);
                MACustomShapes.shapeData.push(JSON.parse(geo.Geometry__c));
            }
        }

        //build ajax info
        var colorOpts = {
            fillColor : $('#CustomShapePopup .fillcolor').val(),
            borderColor : $('#CustomShapePopup .bordercolor').val(),
            fillOpacity : $('#CustomShapePopup .fillopacity').val(),
            labelEnabled : $('#CustomShapePopup #custom-shapelayer-label-enabled').is(':checked'),
            labelOverride : $('#CustomShapePopup .label-text-override-input').val(),
            labelJustification : $('#CustomShapePopup #custom-shapelayer-label-justification').val(),
            labelFontSize : $('#CustomShapePopup #custom-shapelayer-label-font-size').val(),
            labelFontColor : $('#CustomShapePopup #custom-shapelayer-label-font-color').val(),
            labelBGColor : $('#CustomShapePopup #custom-shapelayer-label-bg-color').val(),
            labelBGOpacity : $('#CustomShapePopup #custom-shapelayer-label-bg-opacity').val()
        };

        //override some colorOpts
        if ($('#CustomShapePopup').data('parcelData')) {
            colorOpts.labelEnabled = false;
            var parcelData = $('#CustomShapePopup').data('parcelData') || {};
            var parcelOptions = {
                isParcel : true,
                modify : false,
                table : parcelData.table || '',
                parcel : parcelData.fipscode || '',
                uid : parcelData.propertyid || '',
                orgId : orgId || '',
                layerUID : parcelData.layerUID || '',
                label : parcelData.label || '',
                proximityType : 'Parcel',
                isSavedParcel : true
            };
            MACustomShapes.shapeData = [parcelOptions];
        }
        else if ($('#CustomShapePopup').data('kmlData')) {
            colorOpts.labelEnabled = false;
            var kmlData = $('#CustomShapePopup').data('kmlData') || {};
            var kmlOptions = {
                isCustom : true,
                id : kmlData.id,
                proximityType : 'KML',
                kmlResourceType: kmlData.kmlResourceType
            };
            MACustomShapes.shapeData = [kmlOptions];
        }
        // create list of geometries
        if (!Array.isArray(MACustomShapes.shapeData)) {
            MACustomShapes.shapeData = [MACustomShapes.shapeData];
        }
        var geometryToStringify = [];
        for (var s = 0; s < MACustomShapes.shapeData.length; s++) {
            var geoToSave = MACustomShapes.shapeData[s];
            geometryToStringify.push({
                Name : name + '-geometry'+s,
                sma__Geometry__c : JSON.stringify(geoToSave)
            });
        }

        //make ajax call to save
        var processData = {
            ajaxResource : 'MATerritoryAJAXResources',
            action: 'saveBoundaryInfoV2',
            serializedTerritory : JSON.stringify({
                Id : territoryId,
                Name : name,
                sma__Description__c : $('#CustomShapePopup .shape-description').val(),
                sma__User__c : userId,
                sma__Folder__c : folderId,
                sma__Options__c : JSON.stringify({"country":"USA","advancedOptions":{"calculateTerritoryAggregates":false,"dissolveGeometry":true},"colorOptions":colorOpts}),
                sma__CustomGeometry__c : true
            }),
            serializedGeometry : JSON.stringify(geometryToStringify)
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(res, event){
                $('#CustomShapePopup .maPopupLoading').addClass('hidden');
                if(event.status) {
                    if(res.success) {
                        if (NewLayerNavigationEnabled())
                        {
                            MALayers.refreshFolder();
                            growlSuccess($('#growl-wrapper'), 'Successfully saved this shape.',4000);
                        }
                        else
                        {
                            //grab color options
                            var options = JSON.parse(res.data.sma__Options__c);
                            var colorOptions = options.colorOptions;
                            var trafficOptions = options.trafficOptions;
                            //add to tree or update
                            if (update)
                            {
                                //update
                                var $node = $('#SQTree li[id="'+res.data.Id+'"]');
                                $node.attr('iconcolor', colorOptions.fillColor);
                                $("#SQTree").jstree('rename_node', '#' + territoryId , res.data.Name);
                                updateIcon($node);
                                growlSuccess($('#growl-wrapper'), 'Successfully updated this shape.',4000);
                            }
                            else
                            {
                                if( $('#SQTree #' + node.attr('id') + ' > ul ').length > 0 ) {
                                    $("#SQTree").jstree("create","#" + $('#SaveShapeTree').jstree('get_selected').attr('id'),"last",{attr : {id: res.data.Id, iconcolor: colorOptions.fillColor, NodeType: 'PersonalTerritory', rel: 'SavedTerritory', title: res.data.Name}, data: res.data.Name},null,true);
                                }
                                growlSuccess($('#growl-wrapper'), 'Successfully saved this shape.',4000);
                            }
                        }

                        if(plot) {
                            //remove the old layer and plot a new one
                            var $layer = $('.PlottedShapeLayer[data-id="'+res.data.Id+'"]');
                            if($layer.length > 0) {
                                $layer.find('.btn-remove').click();
                            }
                            if(shape) {
                                $layer = $('.layer[qid="'+shape.qid+'"]');
                                if($layer.length > 0) {
                                    $layer.find('.btn-remove').click();
                                }
                            }
                            MACustomShapes.drawV2({id: res.data.Id});
                        }

                        //ClosePopupWindow();
                        MALayers.hideModal();
                    }
                    else {
                        var errMsg = res.message || 'Unknown Error';
                        MAToastMessages.showError({message:errMsg,timeOut:5000});
                    }

                }
                else {
                    growlError($('#growl-wrapper'), 'Unable to save custom shape.',4000);
                    MA.log('Shape Save Failed',res);
                }
            },
			{escape:false}
        );
    },

    updateShapeGeometry : function (options,callback) {
        callback = callback || function(){};
        var shape = options.shape;
        var $layer = options.layer;
        var dataId = $layer.attr('data-id');
        var shapeData = {};
        if(typeof(shape.getCenter) == 'function') {
            //circle
            //get the center
            var center = shape.getCenter();

            shapeData = {
                proximityType : 'Circle',
                center : { lat : center.lat(), lng : center.lng()},
                radius : shape.getRadius(),
                isCustom : true
            }
        }
        else if(typeof(shape.getPath) == 'function') {
            //poly
            var tempData = {
                proximityType : 'Polygon',
                points : [],
                isCustom : true
            }

            //loop over the points to get the lat lng
            var points = shape.getPath();
            for (var i =0; i < points.getLength(); i++) {
                var xy = points.getAt(i);
                tempData.points.push({lat: xy.lat(), lng: xy.lng()})
            }

            shapeData = tempData;
            tempData = null;
        }
        else if(typeof(shape.getBounds) == 'function') {
            //rectangle
            var tempData = {
                proximityType : 'Rectangle',
                bounds : {},
                isCustom : true
            }

            //get the bounds
            var bounds = shape.getBounds();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            tempData.bounds = {
                NE : {lat : NE.lat(), lng : NE.lng()},
                SW : {lat : SW.lat(), lng : SW.lng()}
            }

            shapeData = tempData;

        }

        var mainShapeInfo = $layer.data('popupData') || {};
        var processData = {
            ajaxResource : 'MATerritoryAJAXResources',

            action: 'saveGeometryInfo',
            geometry        : JSON.stringify(shapeData),
            geometryName    : (mainShapeInfo.name || 'custom') + '-geometry',
            territory       : $layer.data('id'),
            removeOldGeo    : true
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(res, event){
                if(event.status) {
                    $('#PlottedQueriesTable .PlottedShapeLayer[data-id="'+dataId+'"]').each(function() {
                        var $layer = $(this);
                        $layer.find('.refresh-shape').click();
                    });
                    callback(res);
                }
                else {
                    callback(res);
                }
            },
			{escape:false}
        );
    },

    getShapeInfo : function (options) {
        var dfd = jQuery.Deferred();
        var processData = {
            ajaxResource : 'MATerritoryAJAXResources',
            action: 'getTerritory',
            id: options.id
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response,event){
                dfd.resolve(response);
            },
            {escape:false}
        );

        return dfd.promise();
    },

    buildShapeData : function (shape) {
        if(typeof(shape.getCenter) == 'function') {
            //circle
            this.shapeType = 'circle';

            //get the center
            var center = shape.getCenter();

            this.shapeData = [{
                proximityType : 'Circle',
                center : { lat : center.lat(), lng : center.lng()},
                radius : shape.getRadius(),
                unit : this.currentLayer.find('.options-circle-unit').val(),
                isCustom : true
            }];
        }
        else if (shape.isTravelGeom) {
            MACustomShapes.shapeData = [shape.saveData] || [{}];
        }
        else if(typeof(shape.getPath) == 'function') {
            this.shapeType = 'polygon';

            var tempData = {
                proximityType : 'Polygon',
                points : [],
                isCustom : true
            }

            //loop over the points to get the lat lng
            var points = shape.getPath();
            for (var i =0; i < points.getLength(); i++) {
                var xy = points.getAt(i);
                tempData.points.push({lat: xy.lat(), lng: xy.lng()})
            }

            this.shapeData = [tempData];
            tempData = null;
        }
        else if(typeof(shape.getBounds) == 'function') {
            //rectangle
            this.shapeType = 'rectangle';

            var tempData = {
                proximityType : 'Rectangle',
                bounds : {},
                isCustom : true
            }

            //get the bounds
            var bounds = shape.getBounds();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            tempData.bounds = {
                NE : {lat : NE.lat(), lng : NE.lng()},
                SW : {lat : SW.lat(), lng : SW.lng()}
            }

            this.shapeData = [tempData];

        }
    },

    createLabel : function (geoInfo,options,shape,name) {
        /*var labelMarker = new google.maps.Marker({
            position: new google.maps.LatLng(33.8792120807938, -80.8650508760346),
            map: MA.map,
            icon: ImageMarkerURL + '&text=' + encodeURIComponent('South Carolina'),
            clickable: false
        }));*/
        var type = geoInfo.proximityType;

        var ImageMarkerURL = 'https://api.mapanything.io/services/images/labels/label.php?fontcolor=' + encodeURIComponent(options.labelFontColor)
                    + '&bgcolor=' + encodeURIComponent(options.labelBGColor)
                    + '&bgopacity=' + encodeURIComponent(options.labelBGOpacity)
                    + '&fontsize=' + encodeURIComponent(options.labelFontSize);

        var labelText = options.labelOverride == '' ? name : options.labelOverride;

        var marker = new google.maps.Marker({
            icon: ImageMarkerURL + '&text=' + encodeURIComponent(labelText),
            clickable: false,
            map: MA.map,
            visible: false
        });

        if (type == 'Polygon' || type == 'travelTime' || type == 'travelDistance' || shape.hasOwnProperty('customShape_multiple')) {
            var bounds = new google.maps.LatLngBounds();
            if (shape.hasOwnProperty('customShape_multiple')) {
                function processPoints(geometry, callback, thisArg) {
                    if (geometry instanceof google.maps.LatLng) {
                        callback.call(thisArg, geometry);
                    }
                    else if (geometry instanceof google.maps.Data.Point) {
                        callback.call(thisArg, geometry.get());
                    }
                    else {
                        geometry.getArray().forEach(function(g) { processPoints(g, callback, thisArg); });
                    }
                }
                shape.forEach(function (feature) {
                    processPoints(feature.getGeometry(), bounds.extend, bounds);
                });
            } else {
                var path = shape.getPath();
                var pointsArr = path.getArray();

                for(i=0; i < pointsArr.length; i++) {
                    var point = pointsArr[i];
                    bounds.extend(point);
                }
            }
            var center = bounds.getCenter();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            if(options.labelJustification == 'right') {
                marker.setPosition(new google.maps.LatLng(center.lat(),NE.lng()));
            }
            else if(options.labelJustification == 'center') {
                marker.setPosition(center);
            }
            else if(options.labelJustification == 'left') {

                marker.setPosition(new google.maps.LatLng(center.lat(),SW.lng()));
            }
        }
        else if(type == 'Circle') {
            var center = shape.getCenter();
            var bounds = shape.getBounds();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            if(options.labelJustification == 'right') {
                marker.setPosition(new google.maps.LatLng(center.lat(),NE.lng()));
            }
            else if(options.labelJustification == 'center') {
                marker.setPosition(center);
            }
            else if(options.labelJustification == 'left') {
                marker.setPosition(new google.maps.LatLng(center.lat(),SW.lng()));
            }
        }
        else if (type == 'Rectangle') {
            var bounds = shape.getBounds();
            var center = bounds.getCenter();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            if(options.labelJustification == 'right') {

                marker.setPosition(new google.maps.LatLng(center.lat(),NE.lng()));
            }
            else if(options.labelJustification == 'center') {
                marker.setPosition(center);
            }
            else if(options.labelJustification == 'left') {
                marker.setPosition(new google.maps.LatLng(center.lat(),SW.lng()));
            }

        }
        else {

        }
        
        return marker;
    },

    drawV2 : function (options) {
        var dfd = $.Deferred();
        //add custom shape to options and create shapelayer
        options = $.extend({
            customShape : true,
            enableEdit : false
        }, options || {});

        MA_DrawShapes.init(options).then(function(){
            dfd.resolve();
        }).fail(function(err) {
            dfd.reject();
        });
        return dfd.promise();
    }

}

var MALassoShapes = {
    boundries: {},
    lassoMove : null,
    lassoMouseUp : null,
    lassoPollyLine : null,
    lassoInProgress : false,
    drawLasso: function(condition)
    {
        var dfd = jQuery.Deferred();

        //clear previous line and listeners
        MALassoShapes.clearPolylineAndListeners();

        //var strokeColor = condition.toLowerCase() == 'add' ? "#258520" : "red";
        var strokeColor = "#232323";
        MALassoShapes.lassoPollyLine = new google.maps.Polyline({map:MA.map,clickable:false,strokeColor: strokeColor,zIndex:1500,strokeWeight: 4});

		//this happens the same way as Bobby described where it simply is just doing a connect the dot when you change direction of the vertices.
		MALassoShapes.lassoMove = google.maps.event.addListener(MA.map,'mousemove',function(e){
		        MALassoShapes.lassoInProgress = true;
				MALassoShapes.lassoPollyLine.getPath().push(e.latLng);
		});

		//once the user releases their mouse button we want to remove our event listener for the move variable
		MALassoShapes.lassoMouseUp = google.maps.event.addListenerOnce(MA.map,'mouseup',function(e){
            MALassoShapes.lassoInProgress = false;
			google.maps.event.removeListener(MALassoShapes.lassoMove);
			var path=MALassoShapes.lassoPollyLine.getPath();
			MALassoShapes.lassoPollyLine.setMap(null);
			MALassoShapes.lassoPollyLine = new google.maps.Polygon({map:MA.map,path:path,strokeColor: strokeColor,strokeWeight: 4});


			google.maps.event.clearListeners(MA.map.getDiv(), 'mousedown');

			//since the user is done drawing the shape we can re-enable the default map click events.
			MALassoShapes.enable();


			var pointsArray = [];
            // do not use dot notation to get latLngs, google offers functions that do not change for this.
            // will cause issues on google api updates => MALassoShapes.lassoPollyLine.latLngs.b
            var googlePathsObj = MALassoShapes.lassoPollyLine.getPaths();
            var paths = googlePathsObj.getArray();
            for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                var latLngs = path.getArray();
                pointsArray = pointsArray.concat(latLngs);
            }
            // $.each(MALassoShapes.lassoPollyLine.latLngs.b,function(key,b){
            //     pointsArray = b.b;
            // });
			//MALassoShapes.lassoPollyLine.setMap(null);
			var $loading = MAToastMessages.showLoading({message:MASystem.Labels.MA_Loading+'...',timeOut:0,extendedTimeOut:0});
			MALassoShapes.processPolylinePoints(pointsArray,condition).then(function(res){
			    MAToastMessages.hideMessage($loading);
			    if(res.success){
			        var geoIds = getProperty(res,'res.data.geoids',false) || [];
			        switch(condition)
			        {
			            case 'add':
			                 MALassoShapes.populateLassoListItems(geoIds).then(function(response){
        			            if(response.success){
            			            dfd.resolve({success:true,pointsArray:response})
            			            MALassoShapes.lassoPollyLine.setMap(null);


        			            } else
        			            {
        			                //build error output for when data is not returned
                			        MALassoShapes.lassoPollyLine.setMap(null);
                			        dfd.resolve({success:false,error:res.errInfo});

                			    }
        			        });
        			        break;

        			    case 'remove':
        			        MALassoShapes.removeLassoListItems(geoIds).then(function(response){
        			            if(response.success){
            			            dfd.resolve({success:true,pointsArray:response})
            			            MALassoShapes.lassoPollyLine.setMap(null);
                                    

        			            } else
        			            {
        			                //build error output for when data is not returned
                			        MALassoShapes.lassoPollyLine.setMap(null);
                			        dfd.resolve({success:false,error:res.errInfo});
                			    }
        			        });
        			        break;
        			    default :
        			        $('#shapeBuilderButtonDefaultPointer').click();

			        }


                    MALassoShapes.lassoPollyLine.setMap(null);
                    MA.map.setOptions({ draggableCursor : "url("+MASystem.Images.cursors.hand+"), auto" });

			    } else {
			        //build error output for when data is not returned
                    MALassoShapes.lassoPollyLine.setMap(null);
                    MA.map.setOptions({ draggableCursor : "url("+MASystem.Images.cursors.hand+"), auto" });
			        dfd.resolve({success:false,error:res.error});

			    }
			});

		});


        return dfd.promise();
    },
    clearPolylineAndListeners : function () {
        try{google.maps.event.removeListener(MALassoShapes.lassoMove);}catch(e){}
        try{google.maps.event.removeListener(MALassoShapes.lassoMouseUp);}catch(e){}
        try{MALassoShapes.lassoPollyLine.setMap(null);}catch(e){}
        try {
            google.maps.event.removeListener(MAShapeSelector.mapToggleListener);
        }
        catch(e){}
        try{google.maps.event.clearListeners(MA.map.getDiv(), 'mousedown');}catch(e){}
    },
    selectedShapeMap : {},
    asyncProccess : null,
    populateLassoListItems : function(geoids,isToggle)
    {
        var dfd = jQuery.Deferred();
        if(!isToggle) {
            $('#shapeBuilderButtonDefaultPointer').click();
        }
        //if no geoids, don't waste time here
        if(!Array.isArray(geoids) || geoids.length == 0) {
            dfd.resolve({success:true});
        }
        else {

            var listItemValues = {};
            var $ulList = $('#shapeBuilderDrawingSelectionList');
            var $loading = MAToastMessages.showLoading({message:MASystem.Labels.MA_Loading+'...', subMessage :'Grabbing your selections...',timeOut:0,extendedTimeOut:0});
            var dataLevel = $('#shapeLayerBuilderInputIWantToSee').val();
            //do we have any previous shapes
            var optionHTML = '';
            if(MALassoShapes.selectedShapeMap == undefined) {
                MALassoShapes.selectedShapeMap = {};
            }

            var shapesToPlot = [];
            $.each(geoids,function(i,geoObj) {
                var label = geoObj.label || '';
                var value = geoObj.value || '';
                var shapeInfo = MALassoShapes.selectedShapeMap[value];
                if(shapeInfo == undefined) {
                    //add to our shapes
                    geoObj.isPlotted = true;
                    geoObj.isActive = true;
                    geoObj.level = dataLevel;
                    MALassoShapes.selectedShapeMap[value] = geoObj;
                    shapesToPlot.push(value);
                }
                else if (shapeInfo != undefined && !shapeInfo.isPlotted) {
                    geoObj.isPlotted = true;
                    geoObj.isActive = true;
                    geoObj.level = shapeInfo.level;
                    MALassoShapes.selectedShapeMap[value] = geoObj;
                    shapesToPlot.push(value);
                }
            });

            processTerritoryHTML('sidebar').then(function(res) {
                var otherShapesToPlot = res.shapesToPlot || [];
                var html = res.htmlString;
                $ulList.html(html);
                shapeBuilderDrawingSelectionCountUpdate();
            });

            //var geoIdArray = Object.keys(MALassoShapes.selectedShapeMap);
            //not reprocessing everything, only those that were not in original map
            var geoIdArray = shapesToPlot;
            var processData = {
                subType: 'boundary',
                action: 'geography',
                version: '1'
            };
            var batchesDone = 0;

            MALassoShapes.asyncProccess = async.queue(function (options, callback) {
                //grab our post body
                var postBody = JSON.stringify(options)

                Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
                    processData,
                    postBody,
                    function(res, event) {
                        callback();
                        batchesDone++;
                        var percentDone = Math.round((batchesDone/batchCount)*100);
                        $loading.find('.toast-message').text('Grabbing your selections... ' + percentDone + '%');
                        if(event.status)
                        {
                           if(res && res.success) {
                                var resData = getProperty(res,'data.data',false) || [];
                                $.each(resData,function(k,v){
                                    $.each(v.geojson.features,function(kk,vv){
                                        var uniquePropId = getProperty(vv,'properties.id',false);
                                        //var propertiesLabel = listItemValues[uniquePropId] || '';

                                        //remove any prevuios shapes
                                        if(uniquePropId != undefined && uniquePropId != '')
                                        {
                                            var shape = getProperty(MALassoShapes,'boundries.' + uniquePropId,false);
                                            if(shape != undefined)
                                            {
                                                shape.setMap(null);
                                                MALassoShapes.boundries[uniquePropId] = null;
                                            }
                                        }

                                        //create new shapes
                                        var newLayer = new google.maps.Data();
                                	    newLayer.addGeoJson(vv);
                                	    //TODO
                                	    //default the colors to be more pleasing, Derek and RJ working on tiles and such
                                	    newLayer.setStyle({
                                	        strokeColor: "#061c3f",
                                            fillColor: "#1589ee",
                                            fillOpacity: "0.2",
                                            strokeWeight: 3,
                                            zIndex:1,
                                            clickable:false
                                	    });

                                	    //is this shape active?
                                	    var isActive = false;
                                	    var shapeInfo = getProperty(MALassoShapes,'selectedShapeMap.'+uniquePropId,false);
                                	    if(shapeInfo != undefined)
                                	    {
                                	        isActive = shapeInfo.isActive;
                                	    }

                                	    if(isActive) {
                                	        newLayer.setMap(MA.map);
                                	    }
                                	    newLayer.boundriesKey = uniquePropId;


                                	    MALassoShapes.boundries[uniquePropId] = newLayer;

                                    });
                                });

                           }
                           else {
                               MA.log(res);
                           }
                        }
                        else {
                            MA.log(event.message);
                        }
                    },{buffer:false,timeout:45000,escape:false}
                );
            });

            //add our batchable portion to our queue
            var geoLength = geoIdArray.length;
            var batchAbleArray = [];
            var tempArray = [];
            var batchCount = 0;
            for(var g = 0; g < geoLength; g++) {
                var geoId = geoIdArray[g];
                tempArray.push(geoId);
                if(tempArray.length >= 20) {
                    var batchOptions = {
                        "geoIds" : tempArray,
                        "format":"GeoJSON",
                        "merged":false,
                        "apitoken":MA.APIKey
                    };
                    MALassoShapes.asyncProccess.push(batchOptions);
                    tempArray = [];
                    batchCount++;
                }
            }
            if(tempArray.length > 0) {
                var batchOptions = {
                    "geoIds" : tempArray,
                    "format":"GeoJSON",
                    "merged":false,
                    "apitoken":""
                };
                MALassoShapes.asyncProccess.push(batchOptions);
                tempArray = [];
                batchCount++;
            }

            $loading.find('.toast-message').text('Grabbing your selections... 0%');

            MALassoShapes.asyncProccess.concurrency = 5;

            MALassoShapes.asyncProccess.drain = function () {
                MAToastMessages.hideMessage($loading);
                shapeBuilderDrawingSelectionCountUpdate();
            };

            if(shapesToPlot.length == 0) {
                MAToastMessages.hideMessage($loading);
            }
        }
        return dfd.promise();
    },
    removeLassoListItems: function(geoids,isToggle)
    {
        var dfd = jQuery.Deferred();
        var listItemValues = {};
        var $ulList = $('#shapeBuilderDrawingSelectionList');
        if(!isToggle) {
            $('#shapeBuilderButtonDefaultPointer').click();
        }
        $.each(geoids,function(i,geoObj) {
            var label = geoObj.label || '';
            var value = geoObj.value || '';
            var shapeInfo = MALassoShapes.selectedShapeMap[value];
            if(shapeInfo != undefined) {
                MALassoShapes.selectedShapeMap[value].isPlotted = false;
                MALassoShapes.selectedShapeMap[value].isActive = false;
            }
        });

        //$ulList.find('li').not('.slds-is-selected').remove();

        var $liTemplate = $('#lasso-list-item-template .lasso-list-item').clone();
        var geoIdArray = [];
        $.each(geoids,function(k,v){
            if($ulList.find('.lasso-list-item[value = "' + v.value + '"]').length > 0)
            {
                var shape = MALassoShapes.boundries[v.value];
                if(shape != undefined) {
                    shape.setMap(null);
                }
                $ulList.find('.lasso-list-item[value = "' + v.value + '"]').removeClass('slds-is-selected');
            }
        });


        //MALassoShapes.lassoItemClickEvent();
        shapeBuilderDrawingSelectionCountUpdate();
        return dfd.promise();
    },
    disable: function()
    {
        MA.map.setOptions({
			draggable: false,
			//zoomControl: false,
			scrollwheel: true,
			disableDoubleClickZoom: false
		});

		/**for(k in MALassoShapes.boundries)
		{
		    var boundryStyle = MALassoShapes.boundries[k].getStyle();
		    boundryStyle.clickable = false;
		    MALassoShapes.boundries[k].setStyle(boundryStyle);

		}*/
    },
    enable: function()
    {
		MA.map.setOptions({
			draggable: true,
			//zoomControl: true,
			scrollwheel: true,
			disableDoubleClickZoom: true
		});
		/**for(k in MALassoShapes.boundries)
		{
		    var boundryStyle = MALassoShapes.boundries[k].getStyle();
		    boundryStyle.clickable = true;
		    MALassoShapes.boundries[k].setStyle(boundryStyle);

		}*/
    },
    lassoItemClickEvent : function(){
        //this event listener is getting created multiple times... only need to be create once
        //moving to on ready
        // $('#shapeBuilderDrawingSelectionList .lasso-list-item').on('click', function() {
        //     var element = this;
        //     $(element).toggleClass('slds-is-selected');

        //     if($(element).hasClass('slds-is-selected'))
        //     {
        //         MALassoShapes.boundries[element.getAttribute('value')].setMap(MA.map);
        //     }
        //     else {
        //         MALassoShapes.boundries[element.getAttribute('value')].setMap(null);
        //     }
        //     shapeBuilderDrawingSelectionCountUpdate();
        //     //shapeBuilderCheckSelectedBoundariesDrawing();
        // });
    },
    processPolylinePoints: function(pointsArray)
    {
        var dfd = jQuery.Deferred();
        var latLngValues = [];
        var MAIOFilters = [];

        //if no points in array, we don't need to process anything,
        //just return
        if(pointsArray == undefined || pointsArray.length == 0) {
            dfd.resolve({success:true,res:{}});
        }
        else {
            $.each($('#shapeBuilderFiltersWrap .filter-list-item'),function(k,v){
                if($(v).data().filterData != null && $(v).data().filterData != undefined){
                    MAIOFilters.push($(v).data().filterData);
                }

            });

            pointsArray.forEach(function(v){
    			latLngValues.push({lat:v.lat(),lng:v.lng()});
    		});

    		MAIOFilters.push({field_id:"spatial",values:latLngValues});

    		var processData = {
                subType: 'boundary',
                action: 'search',
                version: '1'
            };

            var postBody = {
                "overlay":$('#shapeLayerBuilderInputCountry').val(),
                "level":$('#shapeLayerBuilderInputIWantToSee').val(),
                "filters": MAIOFilters
            }

    	    Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
                processData,
                JSON.stringify(postBody),
                function(res, event) {
                    if(event.status){
                        if(getProperty(res,'success',false) || false )
                        {

                            dfd.resolve({success:true,res:res});
                        }
                        else {
                            var errMsg = res.message || res.error || 'Unknown Error';
                            dfd.resolve({success:false,error:errMsg});
                        }
                    }
                    else {
                        var errMsg = event.messgae;
                        dfd.resolve({success:false,error:errMsg});
                    }

                },{timeout:120000,buffer:false}

            );
        }

        return dfd.promise();
    },
    transferSelectedAndSave: function(plotAfterSave)
    {
        var dfd = jQuery.Deferred();
        $('#shapeBuilderDetailsName').val($('#shapeBuilderDetailsNameDrawingMode').val());
        var $ulList = $('#shapeBuilderDrawingSelectionList');
        var $selectedOptions = $('#shapeBuilderSelectedShapesColumn .slds-select');
        //$selectedOptions.empty();//we want to make sure its empty before we transfer I data to save.
        var optionsString = '';
        processTerritoryHTML('modal').then(function(res) {
            optionsString = res.htmlString;
            $selectedOptions.html(optionsString);

            //Now refresh the available shapes, removing the one(s) already selected.

            var $options = $(optionsString);
            var $availableSelectList = $('#shapeBuilderAvailableShapesColumn .slds-select');
            var geoIds = $availableSelectList.data('allGeoIds');

            var selectedGeoIDs = new Array();

            for(var i=0; i<$options.length;i++) {
                selectedGeoIDs.push($($options[i]).val());
            }

            geoIds = geoIds.filter(function(geoId){
                var foundGeoIds = selectedGeoIDs.filter(function(shape){
                    return geoId.value === shape;
                });

                return foundGeoIds.length == 0;
            });
            
            processTerritoryHTML('modal', geoIds).then(function (res)
            {
                optionsString = res.htmlString;
                $availableSelectList.html(optionsString);
            });
           
        });

        //need to move this to worker
        var keys = Object.keys(MALassoShapes.selectedShapeMap) || [];
        var length = keys.length;
        var c = 0;
        setTimeout(function doBatch() {
            if(c < length) {
                var recordsProcessed = 0;
                while (recordsProcessed < 50 && c < length) {
                    recordsProcessed++;
                    var prop = keys[c];
                    var shapeInfo = MALassoShapes.selectedShapeMap[prop];
                    if(shapeInfo != undefined) {
                        var isActive = MALassoShapes.selectedShapeMap[prop].isActive;
                        //if not active, remove from map
                        if(!isActive) {
                            MALassoShapes.selectedShapeMap[prop] = undefined;

                            //make sure our plotted shape is removed
                            var shape = MALassoShapes.boundries[prop];
                            if(shape != undefined) {
                                shape.setMap(null);
                                MALassoShapes.boundries[prop] = undefined;
                            }
                        }
                    }
                    c += 1;
                }

                setTimeout(doBatch, 1);
            }
            else {
                dfd.resolve({success:true});
            }
        },1);

        return dfd.promise();

    }
}

var MACopyAndPasteZipCodes = {
    //We need to retrieve the zipcodes that the user has pasted.
    getUserEntry : function()
    {
        var userEntry = MACopyAndPasteZipCodes.formatUserEntry($('#shapeBuilderPasteClipboardTextArea').val());
        MACopyAndPasteZipCodes.sendUserEntry(userEntry);
    },
    //The function removes any new lines, or extraneous white space or commas and returns the information in an array.
    formatUserEntry : function(userEntryString)
    {
        return userEntryString.split(/[\s,]+/);

    },
    //Now we send the userEntry off to MAIO for processing. This will determine which postal codes are good and which are bad.
    sendUserEntry : function(userEntryArray)
    {
        var processData = {
            subType: 'boundary',
            action: 'zipimport',
            version: '1'
        };
        var $button = $('#CreateTerritoryPopup .js-show-shape-builder-paste-clipboard');
        var buttonData = $button.data() || {};
        var importData = {
            "zips": userEntryArray,
            "country_code": $('#shapeLayerBuilderInputCountry').val(),
            "levels": buttonData.levels
        };
        Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
            processData,JSON.stringify(importData),
            function(res, event) {
                //done saving analytics
                if(event.status){
                    if(res.success)
                    {
                        var validZips = getProperty(res,'data.validZips') || [];
                        var validZipCount = validZips.length;
                        var badZips = getProperty(res,'data.invalidZips') || [];
                        var badZipCount = badZips.length;
                        var $shapeBuilderSelectedColumn = $('#shapeBuilderSelectedShapesColumn .slds-select');
                        var dataLevel = $('#shapeLayerBuilderInputIWantToSee').val();
                        
                        $.each(validZips,function(k,v){
                            var zipValue = getProperty(v,'value');
                            var zipLabel = getProperty(v,'label');
                            if(MALassoShapes.selectedShapeMap[zipValue] == undefined) {
                                MALassoShapes.selectedShapeMap[zipValue] = {'label':zipLabel,'value':zipValue,'isPlotted':false,'level':'4','isActive':true};
                            }
                        });

                        var shapeHTML = processTerritoryHTML('modal').then(function(res) {
                            optionsString = res.htmlString;
                            $shapeBuilderSelectedColumn.html(optionsString);
                            checkForSelectedShapes();
                        });
                        if(badZipCount > 0 )
                        {
                            showInvalidZips(badZips,validZipCount);
                            $('#shapeBuilderPasteClipboardBase').hide();
                        } else {
                            $('#shapeBuilderPasteClipboardPopover').hide();
                            
                        }
                        
                        $('#shapeBuilderPasteClipboardProcessingSuccessTooltip').addClass("in");
                        $('#shapeBuilderAvailableShapesColumn').removeClass('slds-transition-hide').addClass('slds-transition-show');
                        $('#shapeBuilderAvailableShapesColumn .slds-select').attr('multiple','multiple');
                        $('#shapeBuilderAvailableShapesSpinner').show();
                        $('#shapeBuilderSelectedShapesColumn').removeClass('slds-transition-hide').addClass('slds-transition-show');
                        $('#shapeBuilderSelectedShapesColumn .slds-select').attr('multiple','multiple');
                        
                        //$('#shapeBuilderPasteClipboardPopover').hide();
                        $('#shapeBuilderPasteClipboardProcessingSuccessTooltip').addClass("in");
                        var extraErrorInfo = badZipCount == 0 ? '' : 'Please review the formatting guidelines for assistance';
                        $('#shapeBuilderPasteClipboardProcessingSuccessTooltip').find('.js-import-results').text(validZipCount +' zip code'+(validZipCount==1 ? '' : 's') + ' successfully imported, ' + badZipCount + ' failure'+(badZipCount==1 ? '. ' : 's. ') + extraErrorInfo);
                        //$('#shapeBuilderPasteClipboardProcessingSuccessTooltip').find('.js-import-results').data('badZips',badZips);
                        
                        
                        setTimeout(function() {
                            $('#shapeBuilderPasteClipboardProcessingSuccessTooltip').removeClass("in");
                        }, 8000);
                    }
                    else {
                        MAToastMessages.showWarning({message:'Import Warning',subMessage:'Something went wrong, please review the formatting guidelines and try again.',timeOut: 8000,closeButton:true});
                    }
                }
                else {
                    MAToastMessages.showWarning({message:'Import Warning',subMessage:'Something went wrong, please review the formatting guidelines and try again.',timeOut: 8000,closeButton:true});
                }

                $('#shapeBuilderAvailableShapesSpinner').hide();
                $('#shapeBuilderPasteClipboardProcessingWrap').hide();
                $('#shapeBuilderPasteClipboardTextAreaWrap').show();
                $('#shapeBuilderPasteClipboardProcessingButton').removeClass('disabled');
                $('#shapeBuilderPasteClipboardCancelButton').removeClass('disabled');
                $('#shapeBuilderPasteClipboardTextArea').val('');


            }
        );

        setTimeout(function() {
            $('#shapeBuilderPasteClipboardProcessingSuccessTooltip').removeClass("in");
        }, 8000);
    }
}

function showInvalidZips(invalidZips,successCount)
{
    var $shapeErrorWrap = $('#shapeBuilderPasteClipboardErrorWrap');
    $shapeErrorWrap.find('.invalid-zips').empty();
    $shapeErrorWrap.find('.error-count').empty().text(invalidZips.length);
    $shapeErrorWrap.find('.success-count').empty().text(successCount);
    var html = '';
    /**var invalidZips = $('#shapeBuilderPasteClipboardProcessingSuccessTooltip').find('.js-import-results').data('badZips');
    var html = '<div class="invalidZipsWrapper"><table style="width: 100%;">';
        html += '<thead><tr><th>Invalid Zipcode</th></tr></thead>';*/
        $.each(invalidZips,function(k,v)
        {
           html += v + '<br />';
        });
        $shapeErrorWrap.find('.invalid-zips').append(html);
        $shapeErrorWrap.show();
        //html += '</table></div>';
        /**
        var invalidZipsPopup = MA.Popup.showMAPopup({
                template: html,
                width : 300,
                popupId : 'invalidZipsPopup',
                title: 'Invalid Postal Codes',
                subTitle : invalidZips.length + ' Invalid Postal Codes',
                buttons: [
                    {
                        text: 'Close',
                        type: 'slds-button_neutral'
                        //no onTap or onclick just closes the popup
                    }
                ]
        });
        */
        
}

/**This function is meant to send out the process and postbody data then using the return populate the
 * available options select list.
 */
function populateAvailableShapeOptions(processData, postBody, force_get_all)
{
    /***************************
     * force_get_all is an attempt to get layers without a filter
     * if true, and returned amount less than 500, show without filter
     * only used on first selection of "I want to see..."
     ***************************/
    var dfd = jQuery.Deferred();

    var MAIOFilters = [];

    var consoldatedMap = {};

    var returnLimit = 5000;
    force_get_all = force_get_all == true ? true : false;
    if (force_get_all)
    {
        returnLimit = 500;
        //TODO
        //this is fake data to force a get, need to adjust with proper info
        MAIOFilters.push({ "field_id": "label", "operator": "not equal to", "values": ["zz"] });
    }
    else
    {
        $.each($('#shapeLayerBuilderTabShapeSelection .filter-list-item'), function (k, v)
        {
            var filterInfo = $(v).data() || {};
            var filterData = filterInfo.filterData;
            if (filterData != undefined)
            {
                MAIOFilters.push(filterData);
            }

        });
    }
    var successfully_found_shapes = false;
    if (MAIOFilters.length > 0)
    {
        $('#shapeBuilderAvailableShapesSpinner').show();
        var $loading = MAToastMessages.showLoading({ message: MASystem.Labels.MA_Loading + '...', timeOut: 0, extendedTimeOut: 0 });
        postBody.filters = MAIOFilters;

        Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
            processData, JSON.stringify(postBody),
            function (res, event)
            {
                MAToastMessages.hideMessage($loading);
                if (event.status)
                {
                    if (res && res.success)
                    {
                        var $availableSelectList = $('#shapeBuilderAvailableShapesColumn .slds-select');
                        var $selectedSelectList = $('#shapeBuilderSelectedShapesColumn .slds-select');
                        $availableSelectList.empty();
                        var geoIds = getProperty(res, 'data.geoids', false) || [];

                        $availableSelectList.data('allGeoIds', geoIds);

                        if (geoIds.length > returnLimit)
                        {
                            $('#shapeBuilderAvailableFilterCue').show();
                        }
                        else
                        {
                            successfully_found_shapes = true;
                            $('#shapeBuilderAvailableFilterCue').hide();
                            var shapeHTML = processTerritoryHTML('modal', geoIds).then(function (res)
                            {
                                optionsString = res.htmlString;
                                $availableSelectList.html(optionsString);
                            });
                        }

                        $('#shapeBuilderAvailableShapesColumn').removeClass('slds-transition-hide').addClass('slds-transition-show');
                        $('#shapeBuilderAvailableShapesColumn .slds-select').attr('multiple', 'multiple');
                        $('#shapeBuilderSelectedShapesColumn').removeClass('slds-transition-hide').addClass('slds-transition-show');
                        $('#shapeBuilderSelectedShapesColumn .slds-select').attr('multiple', 'multiple');

                        dfd.resolve({ success: true, foundShapes: successfully_found_shapes });
                    }
                    else
                    {
                        //do we have an error msg?
                        var errInfo = res.errInfo;
                        try
                        {
                            var parsedError = JSON.parse(errInfo);
                            errInfo = getProperty(parsedError, 'error.message', false) || 'Unknown Error';
                        }
                        catch (e)
                        {
                            var sfError = res.message;
                            var isWarning = false;
                            if (sfError.indexOf('Exceeded max size') > -1)
                            {
                                sfError = 'Please add a filter to narrow down the available shapes.';
                                isWarning = true;
                            }
                            errInfo = sfError || 'Unknown Error';
                        }
                        var errorMsg = errInfo;
                        var geoToGet = $('#shapeLayerBuilderInputIWantToSee option:selected').text();
                        if (isWarning)
                        {
                            MAToastMessages.showWarning({ message: 'Unable to get ' + geoToGet, subMessage: errorMsg, extendedTimeOut: 0, timeOut: 8000, closeButton: true });
                        }
                        else
                        {
                            MAToastMessages.showError({ message: 'Unable to get ' + geoToGet, subMessage: errorMsg, extendedTimeOut: 0, timeOut: 8000, closeButton: true });
                        }
                        if ($('#shapeBuilderAvailableShapesColumn select option').length == 0) { $('#shapeBuilderAvailableFilterCue').show(); }
                        dfd.resolve({ success: false });
                    }
                }
                else
                {
                    MA.log('event error', event);
                    if ($('#shapeBuilderAvailableShapesColumn select option').length == 0) { $('#shapeBuilderAvailableFilterCue').show(); }
                    var errorMsg = event.message || 'Unknown Error';
                    var geoToGet = $('#shapeLayerBuilderInputIWantToSee option:selected').text();
                    //MAToastMessages.showError({ message: 'Unable to get ' + geoToGet, subMessage: errorMsg, extendedTimeOut: 0, timeOut: 8000, closeButton: true });
                    dfd.resolve({ success: false });
                }
            }, { buffer: false, timeout: 60000, escape: false }
        );
    }
    else
    {
        dfd.resolve({ success: false, error: "No filters were applied." })
    }
    return dfd.promise();

}

var MAShapeSelector = {
    countryData : {},
    fieldData : {},
    isLoaded : false,
    mapToggleListener : null,
    mapToggleLoading : null,
    mapToggleCallsOut : 0,
    //This builds out our country select list as well as their available shapes
    populateCountryDropDown : function()
    {
        var $countrySelect = $('#shapeLayerBuilderInputCountry');
        var $seeSelect = $('#shapeLayerBuilderInputIWantToSee');
        if(!MAShapeSelector.isLoaded) {
            MAShapeSelector.isLoaded = true;

            //init our select boxes on first load
            $countrySelect.select2();
            $seeSelect.select2();

            //quick select2 css fix
            $countrySelect.closest('.slds-select_container').find('.select2-container').css('width','inherit');
            $seeSelect.closest('.slds-select_container').find('.select2-container').css('width','inherit');
        }

        $countrySelect.empty();//we dont want a bunch of duplicates so we will make sure its always empty when we start
        MAShapeSelector.countryData = {};

        var processData = {
            subType: 'boundary',
            action: 'overlays',
            version: '1',
            apitoken:MA.APIKey || ''
        };

        // this var is used in 1-2 places but since this is legacy I'm taking path of least damage.
        // removing old cloudbilt call and replacing with MAIO (Security P1 issue)
        MA.TM.countries = {}; // var is update in response below

        Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequest,
            processData,{},
            function(res, event) {
                //done saving analytics
                if(event.status){
                    if(res && res.success) {
                        var optionsString = ''
                        var overlays = getProperty(res,'data.overlays',false) || [];
                        for (var i = 0; i < overlays.length; i++) {
                            var country = overlays[i] || {};
                            var countryId = country.id;
                            var legacyId = country.id;
                            var label = country.label;
                            var levels = country.levels;
                            var zipImport = country.zip_supported || false;
                            // handle legacy global object
                            if (label === 'Custom') {
                                legacyId = 'CUS'
                            }
                            MA.TM.countries[legacyId] = {
                                label: label,
                                adminLevels: levels
                            };
                            MAShapeSelector.countryData[countryId] = country;
                            optionsString += '<option data-zip_supported="'+zipImport+'" value="' + countryId + '">' + getProperty(country,'label',false) + '</option>' ;
                        }
                        $countrySelect.append(optionsString);

                        //default the select list to usa
                        $countrySelect.val('USA').change();

                    }
                    else {
                        var errMsg = res != undefined ? (res.error || res.message || 'Unknown Error') : 'Unknown Error';
                        MAToastMessages.showError({message:'Something went wrong...',subMessage:errMsg,timeOut:0,extendedTimeOut:0,closeButton:true});
                    }
                }
                else {
                    var errMsg = event.message || 'Unknown Error';
                    MAToastMessages.showError({message:'Something went wrong...',subMessage:errMsg,timeOut:0,extendedTimeOut:0,closeButton:true});
                }
            }
        );


                //shapeLayerBuilderInputCountry
    },
    populateIWantToSeeSelect: function(countryId)
    {
        var $iWantToSeeSelect = $('#shapeLayerBuilderInputIWantToSee');
        $iWantToSeeSelect.empty();

        $iWantToSeeSelect.on('change',function()
        {
            var iWantToSee = $(this).val();
            var processAvailableData = {
                    subType: 'boundary',
                    action: 'search',
                    version: '1'
            };

            var processPostBody = {
                "overlay":$('#shapeLayerBuilderInputCountry').val(),
                "level":iWantToSee,
                "filters": []
            }
             populateAvailableShapeOptions(processAvailableData,processPostBody).then(function(){$('#shapeBuilderAvailableShapesSpinner').hide();});

        });
        var optionsString = '<option selected="selected" value="defaultoption">- Select a Shape Type -</option>';
        $.each(getProperty(MAShapeSelector,'countryData.' + countryId + '.levels',false) || [],function(iterate,level)
        {
            optionsString += '<option value="' + getProperty(level,'id',false) + '">' + getProperty(level,'label_plural',false) + '</option>'
        });
        $iWantToSeeSelect.append(optionsString);

        //shapeLayerBuilderInputIWantToSee
    },
    populateFilterForm: function()
    {
        var dfd = jQuery.Deferred();
        var country = $('#shapeLayerBuilderInputCountry').val();
        var level = $('#shapeLayerBuilderInputIWantToSee').val();
        var $fieldSelect = $('#filterExample1 .field-select').html('<option>'+MASystem.Labels.MA_Loading+'...</option>').attr('disabled','disabled');
        var $operatorSelect = $('#filterExample1 .operator-select').empty().attr('disabled','disabled');
        var processData = {
            subType: 'boundary',
            action: 'overlays',
            version: '1',
            apitoken:MA.apitoken || ''
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequest,
            processData,{overlay:country,level:level,fields:true},
            function(res, event) {
                $fieldSelect.empty().removeAttr('disabled','disabled');
                $operatorSelect.removeAttr('disabled','disabled');
                if(event.status)
                {
                    if(res.success)
                    {
                        MAShapeSelector.fieldData = {};
                        var optionsString = ''
                        $fieldSelect.on('change',function(){
                            MAShapeSelector.populateFieldOperatorSelect($fieldSelect.val());
                        })
                        $.each(getProperty(res,'data.overlays',false) || [], function(iterate,country){
                            $.each(getProperty(country,'levels',false) || [], function(iter,level){
                                $.each(getProperty(level,'fields',false) || [], function(iter,field){
                                    var fieldId = getProperty(field,'id',false);
                                    MAShapeSelector.fieldData[fieldId] = field;
                                    optionsString += '<option value="' + fieldId + '">' + getProperty(field,'label',false) + '</option>' ;
                                });
                            });
                        });
                        $fieldSelect.append(optionsString).change();
                        dfd.resolve({success:true})
                    }

                }
            }
        );

        return dfd.promise();
    },
    runStringMatchSearch: function(input)
    {

        var dfd = jQuery.Deferred();
        var country = $('#shapeLayerBuilderInputCountry').val();
        var level = $('#shapeLayerBuilderInputIWantToSee').val();
        var field = $('.filter-form-container .field-select').val();
        var processData = {
            subType: 'boundary',
            action: 'autocomplete',
            version: '1'

        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequest,
            processData,{overlay:country,level:level,field:field,searchterm:input},
            function(res, event) {
                if(event.status)
                {
                    if(res.success)
                    {

                        dfd.resolve({success:true,data:res.data});
                    }

                }
            }
        );
        return dfd.promise();
    },
    autoCompleteDelay: function(ms){
        var timer = 0;
        return function(callback){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
        };
    },
    populateFieldOperatorSelect: function(fieldId)
    {
        var string =  ['contains', 'equals','not equal to', 'starts with','does not contain'];
        var decimal = ['equals','range', 'less than', 'greater than', 'less or equal', 'greater or equal', 'not equal to'];
        var date =    ['equals','range', 'less than', 'greater than', 'less or equal', 'greater or equal', 'not equal to'];

        var $filterPopup = $('#filterExample1');
        var $operatorSelect = $filterPopup.find('.operator-select').empty();
        var $input = $filterPopup.find('#filterItemValueInput');

        var fieldFormatData = getProperty(MAShapeSelector,'fieldData.' + fieldId) || {};
        var filterAs = getProperty(fieldFormatData,'filter_as') || '';
        var optionsString = '';
        switch(filterAs)
        {
            case "decimal" :
            $('.filter-form-container').attr('field-datatype','decimal');
                $.each(decimal,function(iterate,filter)
                {
                    optionsString += '<option value="' + filter + '">' + filter + '</option>'
                });
            break;
            default:
            $('.filter-form-container').attr('field-datatype','string');
                $.each(string,function(iterate,filter)
                {
                    optionsString += '<option value="' + filter + '">' + filter + '</option>'
                });
        }
        $operatorSelect.on('change',function(){
            var op = $(this).val();
            if(op == 'range'){
                $('.string-label').hide();
                $('.range-label').show();
                $('#MaxValueInput').show();
            } else {
                $('.string-label').show();
                $('.range-label').hide();
                $('#MaxValueInput').hide();
            }
        });
        $operatorSelect.append(optionsString).change();
        var $filterItemValueDropDown = $('#filterItemValueDropdown ul');
        // handle listeners (need to redo this!)
        $input.unbind('keyup');
        $input.on('keyup', function (event) {
            clearTimeout(MAShapeLayer.searchTimeout);
            MAShapeSelector.counter++;
            var thisSearchCount = MAShapeSelector.counter;
            $('#shapeFilterSpinner').show();
            $('#filterItemValueDropdown').show();
            $filterItemValueDropDown.empty();

            // if we hit enter, stop here and fill in value
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if(keycode === 13) {
                var value = $input.val();
                var pill = '';
                if(value.indexOf('|') > -1) {
                    var pillSplit = value.split('|');
                    for(var i = 0; i < pillSplit.length; i++) {
                        var pillText = pillSplit[i];
                        if(pillText != '') {
                            pill += '<span data-value="'+pillText+'" class="filter-pill slds-pill slds-pill_link"><a href="javascript:void(0);" class="slds-pill__action" title="' + pillText + '"><span class="slds-pill__label filter-pill-value">' + pillText + '</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>';
                        }
                    }
                }
                else {
                    pill = '<span data-value="'+value+'" class="filter-pill slds-pill slds-pill_link"><a href="javascript:void(0);" class="slds-pill__action" title="' + value + '"><span class="slds-pill__label filter-pill-value">' + value + '</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>';
                }
                //filter-dropdown-item
                $('#filterItemValueDropdown').hide();
                $('.filter-item-pills').append(pill);
                $input.val('');
                $('.filter-item-pills').show();
                return;
            }

            // if less than 1 chars don't search
            if($input.val().length === 0) {
                $('#shapeFilterSpinner').hide();
                $('#filterItemValueDropdown').hide();
                return;
            }
            MAShapeSelector.searchTimeout = setTimeout(function() {
                if(thisSearchCount === MAShapeSelector.counter)
                {
                    MAShapeSelector.runStringMatchSearch($input.val()).then(function(res){
                        
                        $('#shapeFilterSpinner').hide();
                        $filterItemValueDropDown.css({'overflow':'y'});
                        //Meck* (Show all containing this text)
                        var ulList = '';
                        ulList += '<li data-label="'+$input.val()+'" data-value="'+$input.val()+'" class="slds-dropdown__item filter-line-item" role="presentation"><a href="javascript:void(0);" role="menuitem" tabindex="0"><span class="slds-truncate filter-dropdown-item" title="' + $input.val() +  '">' + $input.val() +  '</span></a></li>'
                        var matchingOptions = getProperty(res,'data.data',false) || [];
                        $.each(matchingOptions,function(k,v)
                        {
                            ulList += '<li data-label="'+v.label+'" data-value="' + (v.value || v.label) + '" class="slds-dropdown__item filter-line-item" role="presentation"><a href="javascript:void(0);" role="menuitem" tabindex="0"><span class="slds-truncate filter-dropdown-item" title="' + v.label + '">' + v.label + '</span></a></li>';
                        })
                        $filterItemValueDropDown.append(ulList);
                        
                        $('.filter-line-item').off('click');
                        $('.filter-line-item').on('click', function() {
                            // check if input has a pipe, if so break it into multiple pills
                            var value = $(this).attr('data-value');
                            var label = $(this).attr('data-label');
                            var pill = '';
                            if(value.indexOf('|') > -1) {
                                var pillSplit = value.split('|');
                                for(var i = 0; i < pillSplit.length; i++) {
                                    var pillText = pillSplit[i];
                                    if(pillText != '') {
                                        pill += '<span data-value="'+pillText+'" class="filter-pill slds-pill slds-pill_link"><a href="javascript:void(0);" class="slds-pill__action" title="' + pillText + '"><span class="slds-pill__label filter-pill-value">' + pillText + '</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>';
                                    }
                                }
                            }
                            else {
                                pill = '<span data-value="'+value+'" class="filter-pill slds-pill slds-pill_link"><a href="javascript:void(0);" class="slds-pill__action" title="' + label + '"><span class="slds-pill__label filter-pill-value">' + label + '</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>';
                            }
                            //filter-dropdown-item
                            $('#filterItemValueDropdown').hide();
                            $('.filter-item-pills').append(pill);
                            $input.val('');
                            $('.filter-item-pills').show();
                        });
                    });
                }
            },1000);

        });
    },
    searchTimeout:null,
    counter: 0
}



/*********************************
*	On Ready
*********************************/
function CustomShapeLayerUpdatePreview() {
    var LayerFillColor = $('#custom-shapelayer-shape-fill-color-input').val();
    var LayerFillOpacity = $('#custom-shapelayer-shape-fill-opacity-input').val();
    var LayerStrokeColor = $('#custom-shapelayer-border-fill-color-input').val();

    var labelEnabled        = $('#custom-shapelayer-label-enabled').is(':checked');
    var labelOverride       = $('#custom-shapelayer-label-override').val();
    var labelJustification  = $('#custom-shapelayer-label-justification').val();
    var labelFontSize       = $('#custom-shapelayer-label-font-size').val();
    var labelFontColor      = $('#custom-shapelayer-label-font-color').val();
    var labelBGColor        = $('#custom-shapelayer-label-bg-color').val();
    var labelBGOpacity      = $('#custom-shapelayer-label-bg-opacity').val();

    try { CustomShapeLayerBuilderPreviewShapeManager.setMap(null); } catch (e) {}

    CustomShapeLayerBuilderPreviewShapeManager = new google.maps.Circle({
        map: CustomShapeMap,
        strokeColor: LayerStrokeColor,
        strokeWeight: 2,
        fillColor: LayerFillColor,
        fillOpacity: LayerFillOpacity,
        center : new google.maps.LatLng(33.7849179687286,-84.5168525242187),
        radius : 300500
     });

     //Remove existing labels, if they exists
    if (CustomShapeLayerBuilderPreviewMarkerArray.length > 0)
    {
        for (var i = 0; i < CustomShapeLayerBuilderPreviewMarkerArray.length; i++)
        {
            CustomShapeLayerBuilderPreviewMarkerArray[i].setMap(null);
        }

        CustomShapeLayerBuilderPreviewMarkerArray = [];
    }
    if (labelEnabled)
    {
        var ImageMarkerURL = 'https://api.mapanything.io/services/images/labels/label.php?fontcolor=' + encodeURIComponent(labelFontColor)
            + '&bgcolor=' + encodeURIComponent(labelBGColor)
            + '&bgopacity=' + encodeURIComponent(labelBGOpacity)
            + '&fontsize=' + encodeURIComponent(labelFontSize);

        if (labelJustification == 'left')
        {
            CustomShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                position: new google.maps.LatLng(33.7849179687286, -87.76530009886727),
                map: CustomShapeMap,
                icon: ImageMarkerURL + '&text=' + encodeURIComponent('Left'),
                clickable: false
            }));
        }
        else if (labelJustification == 'center')
        {
            CustomShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                position: new google.maps.LatLng(33.7849179687286, -84.51685252421873),
                map: CustomShapeMap,
                icon: ImageMarkerURL + '&text=' + encodeURIComponent('Center'),
                clickable: false
            }));
        }
        else if (labelJustification == 'right')
        {
            CustomShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                position: new google.maps.LatLng(33.7849179687286, -81.2684049495702),
                map: CustomShapeMap,
                icon: ImageMarkerURL + '&text=' + encodeURIComponent('Right'),
                clickable: false
            }));
        }

    }
}

function ShapeLayerUpdatePreview()
{
    var LayerFillColor = $('#shapelayer-shape-fill-color-input').val();
    var LayerFillOpacity = $('#shapelayer-shape-fill-opacity-input').val();
    var LayerStrokeColor = $('#shapelayer-border-fill-color-input').val();

    var labelEnabled        = $('#shapelayer-label-enabled').is(':checked');
    var labelOverride       = $('#shapelayer-label-override').val();
    var labelJustification  = $('#shapelayer-label-justification').val();
    var labelFontSize       = $('#shapelayer-label-font-size').val();
    var labelFontColor      = $('#shapelayer-label-font-color').val();
    var labelBGColor        = $('#shapelayer-label-bg-color').val();
    var labelBGOpacity      = $('#shapelayer-label-bg-opacity').val();

    var currentlyDissolved = false;

    var dissolveGeometry = $('#CreateTerritoryPopup .dissolve-geometry').is(':checked');



    try { ShapeLayerBuilderPreviewShapeManager.setMap(null); } catch (e) {}



    ShapeLayerBuilderPreviewShapeManager = new google.maps.Data({
        map: ShapeLayerPreviewMap,
        style: {
            strokeColor: LayerStrokeColor,
            strokeWeight: 2,
            fillColor: LayerFillColor,
            fillOpacity: LayerFillOpacity
        }
     });

    if (dissolveGeometry)
    {
        ShapeLayerBuilderPreviewShapeManager.addGeoJson(SEStatesDissolved);
    }
    else
    {
        ShapeLayerBuilderPreviewShapeManager.addGeoJson(SEStatesNotDissolved);
    }


    //ShapeLayerBuilderPreviewMarkerArray



    //Make the labels

    //Remove existing labels, if they exists
    if (ShapeLayerBuilderPreviewMarkerArray.length > 0)
    {
        for (var i = 0; i < ShapeLayerBuilderPreviewMarkerArray.length; i++)
        {
            ShapeLayerBuilderPreviewMarkerArray[i].setMap(null);
        }

        ShapeLayerBuilderPreviewMarkerArray = [];
    }
    if (labelEnabled)
    {
        var ImageMarkerURL = 'https://api.mapanything.io/services/images/labels/label.php?fontcolor=' + encodeURIComponent(labelFontColor)
            + '&bgcolor=' + encodeURIComponent(labelBGColor)
            + '&bgopacity=' + encodeURIComponent(labelBGOpacity)
            + '&fontsize=' + encodeURIComponent(labelFontSize);

        if (dissolveGeometry)
        {
            if (labelJustification == 'left')
            {
                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(29.7997095, -88.473227),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Southeast States'),
                    clickable: false
                }));
            }
            else if (labelJustification == 'center')
            {
                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(31.5986396505468, -83.5993269907065),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Southeast States'),
                    clickable: false
                }));
            }
            else if (labelJustification == 'right')
            {
                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(29.7997095, -78.499301),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Southeast States'),
                    clickable: false
                }));
            }

        }
        else
        {
            if (labelJustification == 'left')
            {
                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(27.7000165, -87.626224),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Florida'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(32.6793865, -85.605165),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Georgia'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(32.5775885, -88.473227),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Alabama'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(33.6167695, -83.352692),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('South Carolina'),
                    clickable: false
                }));
            }
            else if (labelJustification == 'center')
            {
                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(28.4781928961719, -82.4655539344436),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Florida'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(32.6381648759795, -83.4273761548062),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Georgia'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(32.7567898557329, -86.8448359458974),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Alabama'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(33.8792120807938, -80.8650508760346),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('South Carolina'),
                    clickable: false
                }));
            }
            else if (labelJustification == 'right')
            {
                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(27.7000165, -79.975425),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Florida'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(32.6793865, -80.751429),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Georgia'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(32.5775885, -84.901191),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('Alabama'),
                    clickable: false
                }));


                ShapeLayerBuilderPreviewMarkerArray.push(new google.maps.Marker({
                    position: new google.maps.LatLng(33.6167695, -78.499301),
                    map: ShapeLayerPreviewMap,
                    icon: ImageMarkerURL + '&text=' + encodeURIComponent('South Carolina'),
                    clickable: false
                }));

            }

        }



    }


}


$(function () {

    //lasso shape event listeners
    $('#shapeBuilderDrawingModeTools').on('click','#shapeBuilderButtonLassoPlus',function(e) {

		//clear previous line and listeners
        MALassoShapes.clearPolylineAndListeners();

		e.preventDefault();
		//in order for this to work we need to disable some of the default map functionality like map scrolling and other click events.
		MALassoShapes.disable();

		//so after we start the process we are going to call our drawLasso function and pass it a callback function
		google.maps.event.clearListeners(MA.map.getDiv(),'mousedown');//ensure we aren't create a lot of listeners
		google.maps.event.addDomListener(MA.map.getDiv(),'mousedown',function(e){

			//for now our callback function is going to log the latitude and longitude of the polyline that is being created.
			MALassoShapes.drawLasso('add').then(function(res){
                if(res.success){

                }
                else {
                    //TODO
                    var errMsg = res.message || res.error || 'Unknown Error';
                    MAToastMessages.showError({message:'Something went wrong...',subMessage:errMsg,timeOut:0,extendedTimeOut:0,closeButton:true});
                }
            });
		});

	});
    $('#shapeBuilderDrawingModeTools').on('click','#shapeBuilderButtonLassoMinus',function(e) {
		e.preventDefault();
		//in order for this to work we need to disable some of the default map functionality like map scrolling and other click events.
		MALassoShapes.disable();

		//clear previous line and listeners
        MALassoShapes.clearPolylineAndListeners();

		//so after we start the process we are going to call our drawLasso function and pass it a callback function
		google.maps.event.clearListeners(MA.map.getDiv(),'mousedown');//ensure we aren't create a lot of listeners
		google.maps.event.addDomListener(MA.map.getDiv(),'mousedown',function(e){
			//for now our callback function is going to log the latitude and longitude of the polyline that is being created.
			MALassoShapes.drawLasso('remove').then(function(res){
                if(res.success){

                }
                else {
                    //TODO
                    var errMsg = res.error || 'Unknown Error';
                    MAToastMessages.showError({message:'Something went wrong...',subMessage:errMsg,timeOut:0,extendedTimeOut:0,closeButton:true});
                }
			})
		});

	});

    $('#shapeBuilderDrawingModeTools').on('click','#shapeBuilderButtonLassoToggle',function(e) {
        //make sure no previous listener still active!


        //clear previous line and listeners
        MALassoShapes.clearPolylineAndListeners();

        //create the listener
        MAShapeSelector.mapToggleListener = MA.map.addListener('click',function(event) {
            var mapClick = event;
            var mapLatLng = mapClick.latLng;
            if(mapLatLng == undefined) {
                MAToastMessages.showWarning({message:'Unable to locate this position.',subMessage:'Please try a different location.',timeOut:5000});
            }
            //add to our calls out
            MAShapeSelector.mapToggleCallsOut++;
            //create a small circle to create a bounding box
            var quickCircle = new google.maps.Circle({center: mapLatLng, radius: 1});
            var quickBounds = quickCircle.getBounds();
            //create a small triangle to send to same MA.IO endpoint, may change later
            var pointsArray = [mapLatLng,quickBounds.getNorthEast(),quickBounds.getSouthWest()];

            $('#shapeBuilderDrawingSelectionListSpinner').show();
			MALassoShapes.processPolylinePoints(pointsArray,'').then(function(res){
                MAShapeSelector.mapToggleCallsOut--;
                if(MAShapeSelector.mapToggleCallsOut <= 0) {
                    $('#shapeBuilderDrawingSelectionListSpinner').hide();
                }
                if(res && res.success) {
                    var geoIds = getProperty(res,'res.data.geoids',false) || [];
                    var firstGeoId = geoIds[0] || {};
                    var geoIdValue = firstGeoId.value;

                    if(geoIdValue != null && geoIdValue != '') {
                        //check if this shape already exists
                        var shapeInfo = MALassoShapes.selectedShapeMap[geoIdValue];
                        var condition;
                        if(shapeInfo == undefined) {
                            condition = 'add';
                        }
                        else if (shapeInfo && shapeInfo.isPlotted == false) {
                            condition = 'add';
                        }
                        else {
                            condition = 'remove';
                        }

                        switch(condition)
                        {
                            case 'add':
                                 MALassoShapes.populateLassoListItems(geoIds,true).then(function(response){
                                    if(response.success){
                                        dfd.resolve({success:true,pointsArray:response});
                                    } else
                                    {
                                        //build error output for when data is not returned
                                        dfd.resolve({success:false,error:res.errInfo});
                        		    }
                                });
                                break;

                            case 'remove':
                                MALassoShapes.removeLassoListItems(geoIds,true).then(function(response){
                                    if(response.success){
                                        
                        	            dfd.resolve({success:true,pointsArray:response});
                                    } else
                                    {
                                        //build error output for when data is not returned
                                        dfd.resolve({success:false,error:res.errInfo});
                        		    }
                                });
                                break;
                            default :
                                $('#shapeBuilderButtonDefaultPointer').click();

                        }
                    }
                }
                else {
                    MAToastMessages.showWarning({message:'Unable to locate this position.',subMessage:'Please try a different location.',timeOut:5000});
                }
			});
        });
    });

	$('#shapeBuilderDrawingSelectionList').on('click','.lasso-list-item', function() {
        var $element = $(this);
        $element.toggleClass('slds-is-selected');
        var dataValue = $element.attr('data-value') || '';
        var dataText = $element.find('.list-item-label').text() || '';
        var boundaries = MALassoShapes.boundries || {};
        var dataLevel = $('#shapeLayerBuilderInputIWantToSee').val();
        var shape = boundaries[dataValue];
        var shapeInfo = MALassoShapes.selectedShapeMap[dataValue];
        //add to our shape map
        if(typeof(MALassoShapes.selectedShapeMap) != 'object') {
            MALassoShapes.selectedShapeMap = {};
        }
        if(shape != undefined) {
            if($element.hasClass('slds-is-selected'))
            {
                shape.setMap(MA.map);

                if(shapeInfo != undefined) {
                    MALassoShapes.selectedShapeMap[dataValue].isPlotted = true;
                    MALassoShapes.selectedShapeMap[dataValue].isActive = true;
                }
            }
            else {
                shape.setMap(null);
                if(shapeInfo != undefined) {
                    MALassoShapes.selectedShapeMap[dataValue].isPlotted = false;
                    MALassoShapes.selectedShapeMap[dataValue].isActive = false;
                }
            }
        }

        shapeBuilderDrawingSelectionCountUpdate();
        //shapeBuilderCheckSelectedBoundariesDrawing();
    });

    $('#CreateTerritoryPopup').on('change','#shapeLayerBuilderInputCountry',function(){
        $('#shapeBuilderPasteClipboardPopover').hide();
        MAShapeSelector.populateIWantToSeeSelect($(this).val());
    });

    $('#shapeBuilderFiltersFooterRemoveButton').on('click','.remove-all-shape-filters',function(){
        var $button = $(this);
        $('#filterItemList').empty();
        //remove popup filter
        $('#filterExample1').hide();
        $('#shapeBuilderFiltersFooterRemoveButton').hide();
        setTimeout(function() {
            $('#shapeBuilderAddFilterButtonTooltip').show();
        }, 150);
        refreshShapeFilters();
    })

    $('#shapeBuilderFiltersWrap').on('click','.js-remove-filter-item', function() {
        removeFilterListItem($(this));
    });

    $('#CreateTerritoryPopup').on('click','.js-remove-pill',function(){
        $(this).closest('.filter-pill').remove();
    });

    $('#filterExample1').on('click','.js-slds-filters__item-popover-done-button',function() {
        //event.stopPropagation();
        hideSLDSFilterCriteria();
        var filterDataArray = [];
        var $filter = $('#filterExample1');
        var filtersString = $filter.find('.operator-select option:selected').html() + ' ';
        var fieldDataType = $filter.find('.filter-form-container').attr('field-datatype') || 'none';
        var filterData = {};
        switch(fieldDataType)
        {
            case 'decimal':
                filtersString += $('#filterItemValueInput').val();
                if($filter.find('.filter-form-container .operator-select').val() == 'range'){
                    filterData = {
                    field_id : $filter.find('.field-select').val(),
                    operator : $filter.find('.operator-select').val(),
                    min: parseFloat($('#filterItemValueInput').val()),
                    max: parseFloat($('#MaxValueInput').val())
                    }
                }else {
                    filterDataArray.push(parseFloat($('#filterItemValueInput').val()));
                    filterData = {
                    field_id : $filter.find('.field-select').val(),
                    operator : $filter.find('.operator-select').val(),
                    values: filterDataArray
                    }
                }

                break;
            case 'string':
                var pills = $filter.find('.filter-pill .filter-pill-value');
                $.each(pills,function(k,f)
                    {
                        filterDataArray.push($(f).html());
                        filtersString += '"' + $(f).html() + '" '
                    }
                );
                filterData = {
                    field_id : $filter.find('.field-select').val(),
                    operator : $filter.find('.operator-select').val(),
                    values: filterDataArray
                }
                break;
            default:


        }

        //update the filter with data from above
        var $activeFilter = $('#filterExample1').data('activeFilter');
        $activeFilter.data('filterData',filterData);
        $activeFilter.find('.field-label').html($('.filter-form-container .field-select option:selected').html());
        $activeFilter.find('.filters-from-pills').html(filtersString);
        $activeFilter.removeClass('active');
        var $filterItem = $activeFilter.find('.filter-item');
        $filterItem.removeClass('slds-is-new');
        $filterItem.find('.filter-content-new').hide();
        $filterItem.find('.filter-content-complete').show();
        $('#shapeBuilderAvailableShapesColumn').removeClass('slds-transition-hide').addClass('slds-transition-show');
        $('#shapeBuilderAvailableShapesSpinner').show();


        var processFilterData = {
            subType: 'boundary',
            action: 'search',
            version: '1'
        };

        var postFilterBody = {
            "overlay":$('#shapeLayerBuilderInputCountry').val(),
            "level":$('#shapeLayerBuilderInputIWantToSee').val()
        };

        populateAvailableShapeOptions(processFilterData,postFilterBody).then(function(res) {
            $('#shapeBuilderAvailableShapesSpinner').hide();
        });

        $('#shapeBuilderSelectedShapesColumn').removeClass('slds-transition-hide').addClass('slds-transition-show');
        showHideAddFilterButton();
    });

    /**********************************
     *
     *
     * ******************************/

	//init tabs
	$('#CreateTerritoryPopup #tabs').tabs({
	    active: 0,
	    activate: function( event, ui )
	        {
	            if (ui.newPanel.selector = '#tab-color-geometry')
	            {
	                //shapelayer_preview_map - change to only happen when the popup is visible
        		    ShapeLayerPreviewMap = new google.maps.Map(document.getElementById('shapelayer_preview_map'), {
                        center: { lat: 30.223999401567077, lng: -83.759765625},
                        zoom: 5,
                        disableDoubleClickZoom: true,
                        draggable: false,
                        mapTypeControl: false,
                        mapTypeControl: false,
                        overviewMapControl: false,
                        panControl: false,
                        rotateControl: false,
                        scaleControl: false,
                        scrollwheel: false,
                        streetViewControl: false,
                        zoomControl: false,
                        scaleControl: false
                    });

                    //Lets remove all the labels now
                    var styledMap = new google.maps.StyledMapType([
                      {
                        featureType: "all",
                        elementType: "labels",
                        stylers: [
                          { visibility: "off" }
                        ]
                      }
                    ],{name: "Styled Map"});


                    ShapeLayerPreviewMap.mapTypes.set('map_style', styledMap);
                    ShapeLayerPreviewMap.setMapTypeId('map_style');

                    ShapeLayerUpdatePreview();

	            }
	        }
    });

    //init tabs
	$('#CustomShapePopup #tabs').tabs({
	    active: 0,
	    activate: function( event, ui )
	        {
	            if (ui.newPanel.selector = '#tab-color-geometry')
	            {
	                //shapelayer_preview_map - change to only happen when the popup is visible
        		    CustomShapeMap = new google.maps.Map(document.getElementById('customShape_preview_map'), {
                        center: { lat: 30.223999401567077, lng: -83.759765625},
                        zoom: 5,
                        disableDoubleClickZoom: true,
                        draggable: false,
                        mapTypeControl: false,
                        mapTypeControl: false,
                        overviewMapControl: false,
                        panControl: false,
                        rotateControl: false,
                        scaleControl: false,
                        scrollwheel: false,
                        streetViewControl: false,
                        zoomControl: false,
                        scaleControl: false
                    });

                    //Lets remove all the labels now
                    var styledMap = new google.maps.StyledMapType([
                      {
                        featureType: "all",
                        elementType: "labels",
                        stylers: [
                          { visibility: "off" }
                        ]
                      }
                    ],{name: "Styled Map"});


                    CustomShapeMap.mapTypes.set('map_style', styledMap);
                    CustomShapeMap.setMapTypeId('map_style');

                    CustomShapeLayerUpdatePreview();

	            }
	        }
    });

	//handle selecting a country
	$('.territory-country').change(function () {
        var $select = $(this);
        var $option = $select.find('option:selected');
		updateCountry({ 
            country: $select.val(),
            zipImport: $option.attr('data-zip_supported') || false
        });
	});

	//hide search results if clicked away
    $(document).mouseup(function (e)
	{
	    var container = $('.search-wrapper .search-input');
	    if (!container.is(e.target) && container.has(e.target).length === 0) {
	        $('.search-wrapper .search-menu').hide();
	    }

	    if(MALassoShapes.lassoInProgress) {
	        MALassoShapes.lassoInProgress = false;
	        $('#shapeBuilderButtonDefaultPointer').click();
	    }
	});

	//delete geometry
	$('.tab-geometry').on('click', '.delete-territory', function()
	{
		var geometryName = $(this).closest('tr').find('.name').text();
		var r=confirm("You are about to delete "+geometryName+".\nAre you sure?");
        if (r==true)
        {
            //Just continue
        }
        else
        {
            //Cancel
            return;
        }

		var $geometryRow = $(this).closest('tr');
		var processData = {
            ajaxResource : 'MATerritoryAJAXResources',

            action: 'deleteGeometryInfo',
            geometryId	: $geometryRow.attr('data-id')
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(res, event){
                if(event.status) {
            	    $geometryRow.remove();
                }
			},
			{escape:false}
		);
	});

	//remove shapeLayer on close button click
	$('#PlottedQueriesContainer .PlottedShapeLayer').on('click', '.btn-remove', function() {

		$('.PlottedShapeLayer').data('dataLayer').setMap(null);
	});

	//for now, select the default country
	$('.territory-country').change();
});

/***********************************
* Support Functions
***********************************/
function toggleZipImport(enabled) {
    var showImport = enabled === true ? true : false;
    var $button = $('#CreateTerritoryPopup .js-show-shape-builder-paste-clipboard').removeData().hide();
    var country = $('#shapeLayerBuilderInputCountry').val();
    if (showImport) {
        // get the level of support
        var currentSelection = MAShapeSelector.countryData[country] || {};
        var postalLevels = currentSelection.zip_postal_levels || [];
        if (postalLevels.length > 0) {
            $button.data({levels:postalLevels}).show();
        }
    }
}
function updateCountry(options)
{
	options = $.extend({
        country: 'USA',
        zipImport: 'false',
		callback: function () {}
	}, options || {})

	//make sure this is a supported country
	var country = MA.TM.countries[options.country];
	if (!country) {
		return;
    }
    // show hide zip import
    var booleanImport = (options.zipImport === 'true' || options.zipImport === true) ? true : false;
    toggleZipImport(booleanImport);

	//clear existing selections
	selectedGeometry = {};
	$('.search-table-wrapper .boundary-row, .search-table-selection .boundary-row').remove();
	refreshBoundarySelectionSummaries();

	//remove advanced options for custom layers
	if (country.label == 'Custom') {
		$('#CreateTerritoryPopup .geometry-tab a').click();
		$('#CreateTerritoryPopup .advanced-tab').hide();
		$('#CreateTerritoryPopup .dissolve-geometry').prop('checked', false);
	}
	else {
		$('#CreateTerritoryPopup .advanced-tab').show();
		$('#CreateTerritoryPopup .dissolve-geometry').prop('checked', true);
	}

	//update admin levels
	$('.search-type-wrapper .search-type').remove();
	$('.search-wrappers .search-wrapper').remove();
	if (country.label == 'Custom' && MA.APIKey == '')
	{
		//no api key
		$('.search-type-wrapper').append($('<div class="search-type" />').text('You need an API key to use custom geometry').css({ 'font-size': '16px', 'font-weight': 'bold', 'color': '#888', 'top': '10px'}));
	}
	else
	{
		//add search types and wrappers
		$.each(country.adminLevels, function (adminLevel, level)
		{
			//create search type
			var $searchType = $("<div class='search-type'></div>");
			if (level.hasGeometry) {
				$searchType.text(level.label).attr({ 'data-adminlevel': adminLevel });
				$searchType.appendTo('.search-type-wrapper');
			}

			//create search wrapper
			var $searchWrapper = $('#TerritoryBuilder-Templates .search-wrapper').clone();
			$searchWrapper.find('.autocomplete-selection').remove();
			$searchWrapper.attr({ 'data-dirty': false, 'data-watermark': level.label+'...', 'data-adminlevel': adminLevel });
			$searchWrapper.appendTo('.search-wrappers');

			//legacy support
			if (level.legacyType) {
				$searchType.attr('data-type', level.legacyType);
				$searchWrapper.attr('data-type', level.legacyType);
			}
		});

		//init
		$('.search-wrappers .search-input').blur();
	}
}

function refreshShapeFilters () {
    var postFilterBody = {
        "overlay":$('#shapeLayerBuilderInputCountry').val(),
        "level":$('#shapeLayerBuilderInputIWantToSee').val()
    };
    var processFilterData = {
        subType: 'boundary',
        action: 'search',
        version: '1'
    };
    var refreshAll = $('#shapeLayerBuilderTabShapeSelection .filter-list-item').length === 0 ? true : false;
    populateAvailableShapeOptions(processFilterData,postFilterBody, refreshAll).then(function(res) {
        $('#shapeBuilderAvailableShapesSpinner').hide();
    });
    showHideAddFilterButton();
}

function showHideAddFilterButton() {
    if (($('#shapeBuilderFiltersDrawOnMapWrap').is(':visible')) && ($('#filterExample1').is(':hidden'))) {
        $('#shapeBuilderFiltersFooterAddFilterButton').show();
    } else {
        $('#shapeBuilderFiltersFooterAddFilterButton').hide();
    }
}

function removeFilterListItem(listItem) {
    listItem.closest('.filter-list-item').remove();
    $('#filterExample1').hide();

    //if no filters, hide remove all
    if($('#shapeBuilderFiltersWrap .filter-item').length == 0) {
        $('#shapeBuilderFiltersFooterRemoveButton').hide();
    }
    refreshShapeFilters();
}

function refreshBoundarySelectionSummaries()
{
	//we'll need admin level metadata for the current country
	var tCountry = $('.territory-country').val();
	var objectLocationString = 'TM.countries.'+tCountry+'.adminLevels';
	var adminLevels = getProperty(MA,objectLocationString,false) || {};

	//null pointed exception, use getProperty
	//var adminLevels = MA.TM.countries[$('.territory-country').val()].adminLevels;

	//aggregate counts per data type
	var adminLevelCounts = {};
	var totalCount = 0;
	$.each(selectedGeometry, function (value, boundary) {
		adminLevelCounts[boundary.adminLevel] = (adminLevelCounts[boundary.adminLevel] || 0) + 1;
		totalCount++;
	});

	//keep track of currently active selection
	var currentlyActiveAdminLevel = $('.selection-aggregates span.active').attr('data-adminlevel');

	//append the counts to the selection aggregates section
	$('.selection-aggregates').html('<span data-adminlevel="all">'+totalCount+' Selected: </span>');
	$.each(adminLevelCounts, function (adminLevel, count) {
		$('<span />')
			.attr({
				'data-adminlevel': adminLevel,
				'data-count': count
			})
			.text(count + ' ' + (count == 1 ? adminLevels[adminLevel].label : adminLevels[adminLevel].pluralLabel))
			.appendTo($('.selection-aggregates'))
		;
	});

	//mark the currently active selection if there is one
	if (currentlyActiveAdminLevel) {
		$('.selection-aggregates span[data-adminlevel="'+currentlyActiveAdminLevel+'"]').addClass('active');
	}

	//sort the selection aggregates section
	$('.selection-aggregates span').sortElements(function (a,b) {
		return parseInt($(a).attr('data-adminlevel')) > parseInt($(b).attr('data-adminlevel'));
	});
}


function showHideShapeLayer ($proxLayer, visible) {
	var map = visible == true ? MA.map : null;
	try { $proxLayer.data('dataLayer').setMap(map); } catch (err) {}
	if(visible) {
	    //this will show all things in the kml (can be different that want was initialy plotted)
	    try { $proxLayer.data('kmlLayer').showDocument(); } catch (err) {}

	    //this block will simply refresh the kml and show what was initiall plotted
	    //uncomment this if we get complaints...
	    /*
    	    $proxLayer.find('.refresh-shape').click();
    	    $proxLayer.find('.shape-visibility .glyphicon').removeClass('ma-icon-hide').addClass('ma-icon-preview');
	    */
	}
	else {
        try { $proxLayer.data('kmlLayer').hideDocument(); } catch (err) {}
	}
    try { $proxLayer.data('proxObject').setMap(map); } catch (err) {}
    try { $.each($proxLayer.data('proxObjects'), function (i, proxObject) { proxObject.setMap(map); }); } catch (err) {}
    // Merge/Unmerge boundaries if changed when shape layer is hidden
    $proxLayer.find('#toggle-dissolve').trigger('change');
    //check if show labels is checked
    var toggleLabelsChecked = $proxLayer.find('#toggle-labels').is(':checked');
    if(toggleLabelsChecked) {
	    try
	    {
	        if ($proxLayer.data('labelmarkers'))
	        {
	            var markers = $proxLayer.data('labelmarkers');
	            for (var i = 0; i < markers.length; i++)
	            {
	                markers[i].setVisible(visible);
	            }
	        }
	    }
		catch (err) {}
   	}

    if(visible == true) {
    	//update the icon
    	$proxLayer.find('.ma-icon-hide').removeClass('ma-icon-hide').addClass('ma-icon-preview');
     }
     else {
     	$proxLayer.find('.ma-icon-preview').removeClass('ma-icon-preview').addClass('ma-icon-hide');
     }
}

function showHideShapeLabels ($proxLayer, visible) {
	try
    {
        if ($proxLayer.data('labelmarkers'))
        {
        	var markers = $proxLayer.data('labelmarkers');
        	if(!visible) {
	            for (var i = 0; i < markers.length; i++)
	            {
	                markers[i].setVisible(visible);
	            }
        	}
        	else {
	        	if(MA.map.getZoom() < 9 && markers.length > 500) {
	        		return;
	        	}
	        	else {
		            var markers = $proxLayer.data('labelmarkers');
		            var length = markers.length > 500 ? 500 : markers.length;
		            for (var i = 0; i < length; i++)
		            {
		                markers[i].setVisible(visible);
		            }
		        }
		    }
        }
    }
    catch (err) {}
}

function editShapeLayer (id) {
    openShapeLayerBuilder();
// 	LaunchPopupWindow($('#CreateTerritoryPopup'), 900);
    clearGeometryInfo();
    $('#CreateTerritoryPopup').data({
        'territoryId': id
    });
    getboundaryInfo();
}

function addShapeClickEvents(shape) {
    google.maps.event.addListener(shape, 'click', function (e) {
        proximityLayer_Click({ position: e.latLng, type: 'polygon', shape: shape });
    });
    google.maps.event.addListener(shape, 'rightclick', function (e) {
        Shape_Context.call(this, e);
    });
}

// plots google shape saved geometries (circle, rectangle, polygon)
function plotCustomShapeGeometries ($layer, geometryInfo) {
    if ($layer === undefined || geometryInfo === undefined) {
        MAToastMessages.showWarning({message: 'Unable to plot shape layer.', subMessage:'Missing layer or shape info.', timeOut: 0, closeButton:true, extendedTimeOut:0});
    } else {
        // treat a single shape as a standard google shape.
    }
}
function plotSingleShape () {

}

var MA_DrawShapes = {
    init: function(options) {
        var dfd = $.Deferred();
        // make sure we have the options needed
        var allowModify = options.hasOwnProperty('customShape') ? options.customShape : false;
        options = $.extend({
            id: '',
            refresh : false,
            modify : allowModify,
            isParcel : false,
            dataLayers : {},
            customShape : null,
            enableEdit : false,
            folderPath : ''
        }, options || {});
        // totango, recent folder updates
        MA_DrawShapes.storeAnalytics(options.id);
        // create or grab shape layer (update or new)
        MA_DrawShapes.createLayerInfo(options).then(function(shapeLayerRef) {
            var $shapeLayer = $(shapeLayerRef);
        
            if (MA.isMobile) {
                VueEventBus.$emit('change-tab', 'layers');
                VueEventBus.$emit('update-layer-tab', 'tabLayersActive');
            } else {
                MALayers.moveToTab('plotted');
            }
            // update popup data based on shape below
            var popupData = {
                description: '',
                modifiedBy: 'N/A',
                createdBy: 'N/A',
                name: ''
            };
            MA_DrawShapes.updatePopupData($shapeLayer, options);
            // plot shape
            var isCustom = true;
            if (options.isParcel) {
                var propertyid = '';
                if (options.propertyid != undefined) {
                    propertyid = options.propertyid;
                } else if (options.uid != undefined) {
                    propertyid = options.uid;
                }
                popupData = {
                    description: 'Property ID: ' + propertyid,
                    modifiedBy: 'N/A',
                    createdBy: 'N/A',
                    name: options.label || ''
                };
                MA_DrawShapes.updatePopupData($shapeLayer, popupData);
                MA_DrawShapes.parcelHelpers.getParcelInfo(options).then(function(shapeData) {
                    MA_DrawShapes.parcelHelpers.updateDomInfo($shapeLayer, options);
                    MA_DrawShapes.parcelHelpers.drawParcelLayer(options, shapeData, $shapeLayer);
                    MA_DrawShapes.finalizeLayer($shapeLayer);
                    dfd.resolve({layer:$shapeLayer});
                }).fail(function(err) {
                    $shapeLayer.find('.adminlevels').css('display','inline-block').text('Unable to find parcel information');
                    $shapeLayer.find('.basicinfo-name').text(options.label || 'Parcel Layer');
                    MA_DrawShapes.finalizeLayer($shapeLayer);
                    dfd.reject({layer:$shapeLayer,error:err});
                });
            } else if (options.customShape) {
                // get data from SFDC
                MA_DrawShapes.customShapeHelpers.getLayerInfo(options.id).then(function(shapeInfo) {
                    MA_DrawShapes.customShapeHelpers.updateDomInfo($shapeLayer, options, shapeInfo.territory);
                    MA_DrawShapes.customShapeHelpers.processShapes(shapeInfo, $shapeLayer, options).then(function() {
                        dfd.resolve({layer:$shapeLayer});
                    }).fail(function(err) {
                        dfd.reject({layer:$shapeLayer,error:err}); 
                    }).always(function() {
                        popupData = {
                            description: getProperty(shapeInfo, 'territory.sma__Description__c', false) || 'N/A',
                            modifiedBy: (getProperty(shapeInfo, 'territory.LastModifiedBy.Name', false) || 'N/A') + ', ' + (getProperty(shapeInfo, 'territory.LastModifiedDate', false) || ''),
                            createdBy: (getProperty(shapeInfo, 'territory.CreatedBy.Name', false) || 'N/A') + ', ' + (getProperty(shapeInfo, 'territory.CreatedDate', false) || ''),
                            name: getProperty(shapeInfo, 'territory.Name', false) || ''
                        };
                        MA_DrawShapes.updatePopupData($shapeLayer, popupData);
                        $shapeLayer.find('.adminlevels').css('display','inline-block');
                        $shapeLayer.find('.zipinfo').show();
                        $shapeLayer.find('.countyinfo').show();
                        $shapeLayer.find('.stateinfo').show();
                        MA_DrawShapes.finalizeLayer($shapeLayer);
                    });
                }).fail(function(err) {
                    console.warn(err);
                    MA_DrawShapes.finalizeLayer($shapeLayer);
                    dfd.reject({layer:$shapeLayer,error:err});
                });
            } else if (options.custom) {
                if (options.shape && MA.isMobile) {
                    var proxObjects = $shapeLayer.data('proxObjects');
                    $shapeLayer.data('custom', true);
                    $shapeLayer.find('[action="plot-shape"]').removeAttr('onclick');
                    proxObjects.push(options.shape);
                    var qid = $shapeLayer.attr('qid');
                    MA_DrawShapes.updatePopupData($shapeLayer, popupData);
                    MA_DrawShapes.finalizeLayer($shapeLayer);
                    dfd.resolve({layer:$shapeLayer});
                } else {
                    dfd.reject({layer:$shapeLayer,error:err});
                }
            } else {
                isCustom = false;
                //send request for territory info
                var processData = {
                    ajaxResource : 'MATerritoryAJAXResources',
                    action: 'getTerritory',
                    id: options.id
                };

                Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                    processData,
                    function(response, event){
                        if(event.status && response.success) {
                            var data = getProperty(response, 'data', false);
                            var territoryData = getProperty(response, 'data.territory', false);
                            //removeNamespace(MASystem.MergeFields.NameSpace, response.data.territory.Geometries__r.records[0]);
                            $shapeLayer.addClass('maTerritory');
                            popupData.description = territoryData.sma__Description__c || 'No description.';
                            popupData.modifiedBy = (territoryData.LastModifiedBy != null ? territoryData.LastModifiedBy.Name + ', ' : 'N/A, ') + territoryData.LastModifiedDate;
                            popupData.createdBy = (territoryData.CreatedBy != null ? territoryData.CreatedBy.Name + ', ' : 'N/A, ') + territoryData.CreatedDate;
                            popupData.name = territoryData.Name;
                            var plottedObj = MAPlotting.plottedIds[options.id];
                            plottedObj = $.extend(plottedObj,popupData);
                            $shapeLayer.attr('data-id',territoryData.Id);
                            //add label to territory
                            var territoryName = territoryData.Name;
                            var territoryDescription = (territoryData.sma__Description__c != null) ? territoryData.sma__Description__c : 'N/A';
                            $('#CreateTerritoryPopup .territory-name').val(territoryName);
                            $('#CreateTerritoryPopup .territory-description').val(territoryDescription);

                            //grab colors
                            var Options = JSON.parse(territoryData.sma__Options__c);

                            var country = Options.country || 'USA';
                            popupData.country = country;
                            var fillColor = Options.colorOptions.fillColor;
                            var borderColor = Options.colorOptions.borderColor;
                            var fillOpacity = Options.colorOptions.fillOpacity || 0.2;

                            var labelEnabled        = Options.colorOptions.labelEnabled        || false;
                            var labelOverride       = Options.colorOptions.labelOverride       || '';
                            var labelJustification  = Options.colorOptions.labelJustification  || 'center';
                            var labelFontSize       = Options.colorOptions.labelFontSize       || '10px';
                            var labelFontColor      = Options.colorOptions.labelFontColor      || '#FFFFFF';
                            var labelBGColor        = Options.colorOptions.labelBGColor        || '#000000';
                            var labelBGOpacity      = Options.colorOptions.labelBGOpacity      || '0.2';

                            var numBoundaries = 0;

                            if(options.refresh) {
                                labelEnabled = options.showLabels;
                            }

                            //grab advanced options
                            var advancedOptions = $.extend({
                                calculateTerritoryAggregates: false,
                                dissolveGeometry: false
                            }, Options.advancedOptions);

                            //build shape Layer Wrapper
                            //$shapeLayer.data('calculateTerritoryAggregates', advancedOptions.calculateTerritoryAggregates);
                            $shapeLayer.find('.basicinfo-name').text(territoryName);
                            var rgb = hexToRgb(fillColor);

                            //build array for all territories
                        
                            var boundaryRequest = 0;
                            var allBoundaries = [];
                            $shapeLayer.find('.adminlevels').empty();
                            var geomRecs = territoryData.sma__Geometries__r.records;
                            $.each(geomRecs, function(recIndex,geomRec){
                                var geometry = JSON.parse(geomRec.sma__Geometry__c);
                                $.each(geometry, function (adminLevel, boundaries) {
                                    //legacy support for old admin level keys
                                    if (adminLevel == 'states') { adminLevel = '1'; }
                                    else if (adminLevel == 'counties') { adminLevel = '2'; }
                                    else if (adminLevel == 'zips') { adminLevel = '4'; }

                                    //legacy support for old county ids
                                    if (country == 'USA' && adminLevel == '2') {
                                        $.each(boundaries, function (index, boundary) {
                                            if (boundary.indexOf('USA-2-') == 0) {
                                                allBoundaries.push(boundary);
                                            }
                                            else {
                                                allBoundaries.push('USA-2-' + boundary.substring(4));
                                            }
                                        });
                                    }
                                    else {
                                        var spacedCountryPrefix = ['SWE'];
                                        //Case 00024001 (DB had spaces in names at some point, removing them here)
                                        //allBoundaries = allBoundaries.concat(boundaries);
                                        $.each(boundaries, function (index, boundary) {
                                            //reduce all spaces to a single space then replace space with underscore
                                            var boundaryPart = boundary.split('-');
                                            if (spacedCountryPrefix.indexOf(boundaryPart[0]) == -1) {
                                                boundary = boundary.replace(/ +(?= )/g,'').replace(/ /g,"_");
                                            }
                                            allBoundaries.push(boundary);
                                        });
                                    }
                                    popupData.geometry = allBoundaries;
                                    var MATMCountries = getProperty(MA,'TM.countries.' + country,false) || {'adminLevels':{}};
                                    var adminLevelMetadata = getProperty(MATMCountries,'adminLevels.' + adminLevel,false);//MA.TM.countries[country].adminLevels[adminLevel];

                                    //In order to avoid showing any rows with 0 results I am checking for the boundries length. This way if there are multiple levels they will still be displayed.
                                    if(adminLevelMetadata !== undefined && boundaries.length > 0) {
                                        $shapeLayer.find('.adminlevels').append($("<div style='color:#A0A0A0;'></div>").text((adminLevelMetadata.pluralLabel || adminLevelMetadata.label_plural) + ': ' + boundaries.length));
                                    }
                                });
                            });


                            //show info for selected geometry
                            $shapeLayer.find('.basicinfo-totalGeometry, .basicinfo-type').text(allBoundaries.length + ' ' + MASystem.Labels.MA_BOUNDARIES);

                            numBoundaries = allBoundaries.length;

                            //create a data layer for this shape layer that will store the features
                            var style = { strokeColor: borderColor, strokeWeight: 2, fillColor: fillColor, fillOpacity: fillOpacity, layer: $shapeLayer, layerType: 'prox', label: '', proxType: advancedOptions.dissolveGeometry ? null : $shapeLayer.find('.basicinfo-name').text() };
                            var hoverStyle = $.extend({}, style, { fillColor: '#000' });
                            var dataLayer = new google.maps.Data({
                                map: MA.map,
                                style: style
                            });
                            $shapeLayer.data('dataLayer', dataLayer);
                            var dissolve = (options.toggleDissolve === true || options.toggleDissolve === false) ? options.toggleDissolve : advancedOptions.dissolveGeometry;
                            //add event handlers
                            dataLayer.addListener('click', function(e) {
                                proximityLayer_Click({
                                    position: e.latLng,
                                    type: 'data',
                                    feature: e.feature,
                                    dissolve: dissolve,
                                    territoryId: MA.getProperty(territoryData, 'Id')
                                });
                            });
                            dataLayer.addListener('rightclick', function (e) { Shape_Context.call(e.feature, e); });
                            dataLayer.addListener('mouseover', function (e) { this.overrideStyle(e.feature, hoverStyle); });
                            dataLayer.addListener('mouseout', function (e) { this.revertStyle(e.feature); });
                            
                            var dissolveGeo = advancedOptions.dissolveGeometry;
                            if(options.toggleDissolve != null) {
                                //update the dissolve options
                                dissolveGeo = options.toggleDissolve;
                            }

                            //loop over geometry and batch results
                            var shapeCountMap = {};
                            if (dissolveGeo)
                            {
                                $shapeLayer.find('#toggle-dissolve').attr('checked','checked');
                                //grab data using geoJSON
                                boundaryRequest++;

                                GetDataFromServer({
                                    data: {
                                        APIKey		: MA.APIKey,
                                        dissolve    : true,
                                        name        : labelOverride || territoryName,
                                        country     : country,
                                        ids         : allBoundaries.join(','),
                                        labelEnabled    : true,
                                        labelOverride   : labelOverride,
                                        labelposition   : labelJustification,
                                        labelFontSize   : labelFontSize,
                                        labelFontColor  : labelFontColor,
                                        labelBGColor    : labelBGColor,
                                        labelBGOpacity  : labelBGOpacity
                                    },
                                    layer: $shapeLayer
                                }).then(function(res) {
                                    if(res.success){
                                        var geomLabels = getProperty(res,'geomLabels') || [];
                                        $.each(geomLabels,function(k,v)
                                        {
                                            var previousCount = shapeCountMap[v.label] || 0;
                                            var newCount = previousCount + v.count;
                                            shapeCountMap[v.label] = newCount;
                                        });
                                    }
                                    boundaryRequest--;
                                });
                            }
                            else
                            {
                                var q =  async.queue(function (options, callback) {
                                    boundaryRequest++;
                                    //grab data using geoJSON
                                    GetDataFromServer({
                                        data: options,
                                        layer: $shapeLayer
                                    }).then(function(res) {
                                        if(res.success){
                                            var geomLabels = getProperty(res,'geomLabels') || [];
                                            $.each(geomLabels,function(k,v)
                                            {
                                                var previousCount = shapeCountMap[v.label] || 0;
                                                var newCount = previousCount + v.count;
                                                shapeCountMap[v.label] = newCount;
                                            });
                                        }
                                        callback();
                                    });
                                });

                                q.concurrency = 5;

                                q.drain = function(){
                                    boundaryRequest = 0;
                                };

                                while(allBoundaries.length > 0) {
                                    //original batch size was 5 at a time, upping for speed increase
                                    var boundariesBatch = allBoundaries.splice(0,10);
                                    q.push({
                                        APIKey	: MA.APIKey,
                                        country	: country,
                                        ids		: boundariesBatch.join(','),
                                        labelEnabled    : true,
                                        labelOverride   : labelOverride,
                                        labelposition   : labelJustification,
                                        labelFontSize   : labelFontSize,
                                        labelFontColor  : labelFontColor,
                                        labelBGColor    : labelBGColor,
                                        labelBGOpacity  : labelBGOpacity
                                    },function(){});
                                }
                            }

                            //set an interval to wait for completion
                            var interval = setInterval(function () {
                                if(boundaryRequest == 0) {
                                    //callback({success:true});
                                    MA_DrawShapes.updatePopupData($shapeLayer, popupData);
                                    MA_DrawShapes.finalizeLayer($shapeLayer);
                                    clearInterval(interval);
                                    $.each(shapeCountMap, function(label,count) {
                                        $shapeLayer.find('.adminlevels').append($("<div style='color:#A0A0A0;'></div>").text(label + ': ' +count));
                                    });

                                    //remove loading mask and show results
                                    $shapeLayer.find('.status').remove();
                                    $shapeLayer.find('.adminlevels').css('display','inline-block');
                                    $shapeLayer.find('.zipinfo').show();
                                    $shapeLayer.find('.countyinfo').show();
                                    $shapeLayer.find('.stateinfo').show();
                                    $shapeLayer.removeClass('loading');
                                    $shapeLayer.find('.svg-shape-icon').show();
                                    $shapeLayer.find('.loading-icon').hide();
                                    $shapeLayer.find('.loadMask').hide();
                                    var qid = $shapeLayer.attr('qid');

                                    //if the shape layer is supposed to default to visible in shape then we need handle that
                                    $shapeLayer.find('.affectvisibility').prop('checked',advancedOptions.affectVisibility);
                                    if(advancedOptions.affectVisibility) {
                                        ChangeVisibilityWhenCircleIsAdded({force:true,keepRelatedShapes:true});
                                    }
                                    //add metadata to each feature that can be used during click events
                                    dataLayer.forEach(function (feature) {
                                        feature.maData = { dataLayer: dataLayer };
                                        feature.label = territoryName;

                                        //add qid to feature for listview
                                        feature.qid = qid;

                                        feature.forEachProperty(function (val, prop) {
                                            feature.maData[prop] = val;
                                        });
                                    });

                                    //if labels are enabled, plot them
                                    //always create marker, show hide in menu
                                    if (true)
                                    {
                                        var labelArray = $shapeLayer.data('labels') || [];

                                        if (labelArray.length > 500)
                                        {
                                            MAShapeLayer.NeedMarkerBoundingEvents = true;
                                        }


                                        var markers = [];

                                        var ImageMarkerURL = 'https://api.mapanything.io/services/images/labels/label.php?fontcolor=' + encodeURIComponent(labelFontColor)
                                            + '&bgcolor=' + encodeURIComponent(labelBGColor)
                                            + '&bgopacity=' + encodeURIComponent(labelBGOpacity)
                                            + '&fontsize=' + encodeURIComponent(labelFontSize);



                                        $.each( labelArray, function( index, value ) {

                                            var markerPosition = new google.maps.LatLng(parseFloat(value.lat),parseFloat(value.lng));
                                            var markerVisible = false;

                                            //check if this is a refresh and labels have been enabled
                                            if(options.refresh && options.showLabels) {
                                                labelEnabled = true;
                                            }

                                            if (labelArray.length > 500)
                                            {
                                                //Check the zoom level, we only want to show markers (when above 500) when we are zoomed in close enough
                                                if (MA.map.getZoom() >= 9)
                                                {
                                                    //Check if the marker is in view or not, if not let's not show it
                                                    if (MA.map.getBounds().contains(markerPosition) && labelEnabled)
                                                    {
                                                        markerVisible = true;
                                                    }
                                                }
                                                if (labelEnabled) {
                                                    $shapeLayer.find('#toggle-labels').attr('checked','checked');
                                                }
                                            }
                                            else
                                            {
                                                if(labelEnabled) {
                                                    markerVisible = true;
                                                    //update the checkbox on the shapelayer
                                                    $shapeLayer.find('#toggle-labels').attr('checked','checked');
                                                }
                                            }

                                            var markerText = value.text;
                                            //MAP-752: single boundary non-merged shapes would not display a label
                                            var isCurrentlyDissolved = options.toggleDissolve || false;
                                            if ( (isCurrentlyDissolved || numBoundaries === 1 ) && labelOverride != undefined && labelOverride != '' && labelOverride.replace(/ /g,'').length > 0 ) {
                                                markerText = labelOverride;
                                                //markerText = value.text;
                                            }

                                            markerIcon = new google.maps.Marker({
                                                position: markerPosition,
                                                map: MA.map,
                                                icon: ImageMarkerURL + '&text=' + encodeURIComponent(markerText),
                                                clickable: false,
                                                visible: markerVisible
                                            });
                                            markers.push(markerIcon);

                                        });
                                        $shapeLayer.data('labelmarkers',markers);

                                    }
                                    dfd.resolve({layer:$shapeLayer});
                                }
                            }, 100);
                        }
                    },
                    {escape:false}
                );
            }
            options.isCustom = isCustom;
            // last pieces
            MA_DrawShapes.addMainClickEvents(options, $shapeLayer);
        });
        return dfd.promise();
    },
    storeAnalytics: function (layerId) {
        trackUsage('MapAnything',{action: 'Plot Shape Layer',subType: 'Shape Layer'});
        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            {
                ajaxResource : 'MATreeAJAXResources',
                action: 'store_layer_analytics',
                track : 'true',
                subtype : 'Shape Layer',
                id : layerId
            },
            function(res, event){
                if(event.status)
                {
                    if(NewLayerNavigationEnabled()) {
                        MALayers.loadRecent();
                    }
                }
            },{buffer:false, timeout: 40000}
        );
    },
    createLayerInfo: function (options) {
        var dfd = $.Deferred();
        if (!options.qid) {
            var qid = new Date().getTime() + 'shapeprox';
            options.qid = qid;
        }
        MAPlotting.plottedIds[options.id] = options;
        var plottedObj = MAPlotting.plottedIds[options.id];
        plottedObj['type'] = 'shape';
        var $shapeLayer;
        if(options.refresh == true) {
            $shapeLayer = options.shapeLayer;
            $shapeLayer.removeData();
            $shapeLayer.data('proxObjects', []);
            //reset checkboxes to default
            $shapeLayer.find('#hide-shape').attr('checked',true);
            $shapeLayer.find('#toggle-dissolve, #toggle-labels').prop('checked', false);
            MA_DrawShapes.appendingDataToShapeLayer($shapeLayer, options);
            dfd.resolve($shapeLayer);
        }
        else {
            options.component = 'ShapeLayer';
            window.VueEventBus.$emit('add-layer', options, function(shapeLayerRef) {
                $shapeLayer = $(shapeLayerRef);
                $shapeLayer.data({
                    proxObjects: [],
                    calculateTerritoryAggregates: false
                });
                MA_DrawShapes.appendingDataToShapeLayer($shapeLayer, options);
                dfd.resolve($shapeLayer);
            });
        }
        return dfd.promise();
    },
    appendingDataToShapeLayer: function ($shapeLayer, options) {
        $shapeLayer.data('editable', options.modify);
        $shapeLayer.data('isParcel', options.isParcel);
        $shapeLayer.data('folderPath', options.folderPath);
        $shapeLayer.addClass('loading');
        if (!MA.isMobile) {
            $shapeLayer.find('.ftu-icon-left').hide();
            $shapeLayer.find('.loading-icon').show();
        }
        $shapeLayer.find('.status').text(MASystem.Labels.MA_Loading+'...');
        //do we have the proximity radius stuff?
        var invertProx = getProperty(userSettings || {}, 'InvertProximity', false) || false;
        var shapeText = invertProx ? 'Only show markers outside shape' : MASystem.Labels.LayersTab_Shape_Display_OnlyShowMarkersInside;
        $shapeLayer.find('.proximityText').text(shapeText);
        $shapeLayer.data('qid', options.qid);
        $shapeLayer.attr('qid', options.qid);
    },
    updatePopupData: function ($shapeLayer, additionalInfo) {
        var popupData = {
            description: additionalInfo.description || '',
            modifiedBy: additionalInfo.modifiedBy || '',
            createdBy: additionalInfo.createdBy || '',
            name: additionalInfo.name || ''
        };
        $shapeLayer.data('popupData', popupData);
    },
    addMainClickEvents: function (options, $shapeLayer) {
        if(options.refresh != true) {
            $shapeLayer.on('click','.refresh-shape',function(event) {
                $shapeLayer.find('.svg-shape-icon').hide();
                $shapeLayer.find('.loading-icon').show();
                var qid = $shapeLayer.data('qid');
                //unrender shape
                unrenderThis($shapeLayer);

                var op = {
                    shapeLayer : $shapeLayer,
                    id : options.id,
                    refresh : true,
                    customShape : options.isCustom,
                    qid: qid
                }
                MA_DrawShapes.init(op);
            });
            $shapeLayer.on('change','#toggle-dissolve',function(event) {
                var mergeBoundariesChecked = event.target.checked;
                var showLabelsChecked = $shapeLayer.find('#toggle-labels').is(':checked');
                var isVisibleChecked = $shapeLayer.find('#hide-shape').is(':checked');
                // Wait until shape layer is visible before doing boundary merge/unmerge
                if (isVisibleChecked) {
                    //unrender shape
                    $shapeLayer.find('.svg-shape-icon').hide();
                    $shapeLayer.find('.loading-icon').show();
                    unrenderThis($shapeLayer);
                    var op = {
                        shapeLayer : $shapeLayer,
                        id : options.id,
                        toggleDissolve : mergeBoundariesChecked,
                        showLabels : showLabelsChecked,
                        refresh : true,
                        qid: $shapeLayer.attr('qid')
                    };
                    MA_DrawShapes.init(op);
                    $shapeLayer.find('#toggle-dissolve').prop('checked', mergeBoundariesChecked);
                    $shapeLayer.find('#toggle-labels').prop('checked', showLabelsChecked);
            }
            });
            function unrenderThis ($proxLayer) {
                try { $proxLayer.data('dataLayer').setMap(null); } catch (err) {}
                try { $proxLayer.data('kmlLayer').hideDocument(); } catch (err) {}
                try { $proxLayer.data('proxObject').centerPoint.setMap(null); } catch (err) {} // remove the centerPoint marker for boundaries that may have a centerPoint on it.
                try { $proxLayer.data('proxObject').setMap(null); } catch (err) {}
                try { $.each($proxLayer.data('proxObjects'), function (i, proxObject) { try{proxObject.centerPoint.setMap(null);}catch(e){} proxObject.setMap(null); }); } catch (err) {}
                try
                {
                    if ($proxLayer.data('labelmarkers'))
                    {
                        var markers = $proxLayer.data('labelmarkers');

                        for (var i = 0; i < markers.length; i++)
                        {
                            markers[i].setMap(null);
                        }
                    }
                }
                catch (err) {}
                //check if show labels is checked
                if($proxLayer.find('#toggle-labels').attr('checked') == 'checked') {
                    try
                    {
                        if ($proxLayer.data('labelmarkers'))
                        {
                            var markers = $proxLayer.data('labelmarkers');

                            for (var i = 0; i < markers.length; i++)
                            {
                                markers[i].setVisible(false);
                            }
                        }
                    }
                    catch (err) {}
                }
            }
    
            //set clicks and mouse events on the correct elements if it's a parcel
            var dropDownElement = '.drop-menu-wrapper';
            if(options.isParcel) {
                dropDownElement += '.shape-options';
            }
    
            $shapeLayer.on('mouseenter',dropDownElement, function(event) {
                var $button = $(this);
                var menuItemPos = $button.position();
                //get position to show menu
                var topPos = menuItemPos.top + 25; //+25px for button size
                if($button.is('.shape-visibility')){
                    $shapeLayer.find('.shape-menu-visibility').css('top',topPos);
                    $shapeLayer.find('.plotted-visibile-icon, .shape-menu-visibility').addClass('active');
                }
                else if ($button.is('.shape-options')) {
                    $shapeLayer.find('.shape-menu-options').css('top',topPos);
                    $shapeLayer.find('.plotted-menu-icon, .shape-menu-options').addClass('active');
                }
    
                var $menu = $button.find('.drop-down-menu');
                var menuOff = $menu.offset();
                var menuHeight = $menu.height();
                //check the menu height and offset
                var totalMenu = menuOff.top + menuHeight;
    
                //get the map dimensions
                var $container = $('#mapcontainer');
                var containerOff = $container.offset();
                var containerHeight = $container.height();
                var containerTotal = containerOff.top + containerHeight;
    
                //appears offscreen
                if(totalMenu >= containerTotal) {
                    //place the menu on the bottom of the container
                    topPos = menuItemPos.top - menuHeight;
                    $menu.css('top',topPos);
                }
            });
    
            $shapeLayer.on('mouseleave',dropDownElement, function(event) {
                $('.drop-down-menu, .btn-lg').removeClass('active');
            });
    
            $shapeLayer.on('click', '.fit-shape', function () {
                var bounds = new google.maps.LatLngBounds();
                //shape layers
                function processPoints(geometry, callback, thisArg) {
                    if (geometry instanceof google.maps.LatLng) {
                        callback.call(thisArg, geometry);
                    }
                    else if (geometry instanceof google.maps.Data.Point) {
                        callback.call(thisArg, geometry.get());
                    }
                    else {
                        geometry.getArray().forEach(function(g) { processPoints(g, callback, thisArg); });
                    }
                }
    
                if(options.isParcel) {
    
                    try {
                        $shapeLayer.data('proxObjects').forEach(function (proxObj) {
                            proxObj.forEach(function (feature) {
                                processPoints(feature.getGeometry(), bounds.extend, bounds);
    
                                MA.map.fitBounds(bounds);
                            });
                        });
                    }
                    catch (err) { MA.log('Unable to include data layer in zoom to fit calculation', err); }
    
                } else if(options.customShape) {
    
                    try {
                        //kml
                        var kmlShape = $shapeLayer.data('kmlLayer');
    
                        var kmlDocs = kmlShape.docs || [];
                        for(var k = 0, kLen = kmlDocs.length; k < kLen; k++) {
                            var kmlDoc = kmlDocs[k];
                            var kmlBounds = kmlDoc.bounds;
                            bounds.union(kmlBounds);
                        }
    
                        MA.map.fitBounds(bounds);
                    }
                    catch(e){}

                    try {
                        if ($shapeLayer.data('customShape_multiple')) {
                            $shapeLayer.data('proxObjects').forEach(function (proxObj) {
                                proxObj.forEach(function (feature) {
                                    processPoints(feature.getGeometry(), bounds.extend, bounds);
        
                                    MA.map.fitBounds(bounds);
                                });
                            });
                        } else {
                            $shapeLayer.data('proxObjects').forEach(function (shape) {
                                try {
                                    //circle/rectangle
                                    var bound = shape.getBounds();
                                    bounds.union(bound);
                                }
                                catch (e) {
                                    //polygon
                                    var path = shape.getPath();
                                    var arr = path.getArray();
                                    for(i=0; i < arr.length; i++) {
                                        var point = arr[i];
                                        var latlng = new google.maps.LatLng(point.lat(),point.lng());
                                        bounds.extend(latlng);
                                    }
                                }
                            });
        
                            MA.map.fitBounds(bounds);
                        }
                    }
                    catch (err) { MA.log('Unable to include data layer in zoom to fit calculation', err); }
    
                } else {
    
                    try {
                        $shapeLayer.data('dataLayer').forEach(function (feature) {
                            processPoints(feature.getGeometry(), bounds.extend, bounds);
    
                            MA.map.fitBounds(bounds);
                        });
                    }
                    catch (err) { MA.log('Unable to include data layer in zoom to fit calculation', err); }
    
                }
            });
    
            //show hide shape layer on change event
            $shapeLayer.on('change','#hide-shape', function(event) {
                var checked = event.target.checked;
                showHideShapeLayer($shapeLayer,checked);
            });
    
            //show hide shape layer label(s) on change event
            $shapeLayer.on('change','#toggle-labels', function(event) {
                if($shapeLayer.find('#hide-shape').is(':checked')) {
                    var checked = event.target.checked;
                    showHideShapeLabels($shapeLayer,checked);
                }
            });
    
            if(!MASystem.User.IsCorporateAdmin && options.modify == false) {
                $shapeLayer.find('.edit-shape').remove();
            }
            else {
                $shapeLayer.on('click','.edit-shape',function(event) {
                    if($shapeLayer.attr('data-type') === 'KML') {
                        MACustomShapes.openPopupSidebar({id : options.id,savedKML: true});
                    }
                    if(options.customShape) {
                        //open popup
                        MACustomShapes.openPopupSidebar({id : options.id});
                    }
                    else {
                     //   LaunchPopupWindow($('#CreateTerritoryPopup'), 900);
                        openShapeLayerBuilder();
                        clearGeometryInfo();
                        $('#CreateTerritoryPopup').data({
                            'territoryId': options.id
                        });
                        getboundaryInfo();
                    }
                });
            }
    
            $shapeLayer.prependTo('#PlottedQueriesTable');
        }
    },
    finalizeLayer: function ($shapeLayer) {
        $shapeLayer.find('.status').remove();
        $shapeLayer.removeClass('loading');
        if (MA.isMobile) {
            $shapeLayer.find('.queryLoader').hide();
            $shapeLayer.find('.queryIcon').show();
        } else {
            $shapeLayer.find('.ftu-icon-left').show();
            $shapeLayer.find('.loading-icon').hide();
        }
        $shapeLayer.find('.loadMask').hide();
    },
    parcelHelpers: {
        getParcelInfo: function (options) {
            var dfdParcel = $.Deferred();
            var parcelOptions = {
                method : 'get',
                action: 'parcel',
                subType : 'data',
                version : '1'
            };
            var fipscode = '';
            if (options.fipscode !== undefined) {
                fipscode = options.fipscode;
            } else if(typeof options.parcel == 'string') {
                //legacy support,split on _ to get fips code
                var parcelParts = options.parcel.split('_');
                if (parcelParts.length == 2) {
                    fipscode = parcelParts[1];
                } else {
                    fipscode = options.parcel;
                }
            }
            var propertyid = '';
            if (options.propertyid != undefined) {
                propertyid = options.propertyid;
            } else if (options.uid != undefined) {
                propertyid = options.uid;
            }
            var params = {
                'propertyid' : propertyid,
                'fipscode' : fipscode
            }
            Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequest,
                parcelOptions,
                params,
                function(res, event){
                    //MAToastMessages.hideMessage($mobileLoadingMessage);
                    if(event.status) {
                        if(res && res.success) {
                            var shapeData = res.data || {};
                            dfdParcel.resolve(shapeData);
                        } else {
                            console.warn('Unable to get parcel info', res);
                            dfdParcel.reject('Unable to get parcel info. Please contact support if this issue persists.');
                        }
                    } else {
                        console.warn('Unable to get parcel info', event);
                        dfdParcel.reject(event.message);
                    }
                }
            );
            return dfdParcel.promise();
        },
        updateDomInfo: function ($shapeLayer, options) {
            if(!options.isSavedParcel) {
                //let's add a save option to side bar
                $shapeLayer.find('.shape-menu-options').append('<li class="drop-menu-item item-selectable saveDataLayerShape" role="presentation"><a role="menuitem">Save Shape</a></li>');
                $shapeLayer.attr('data-id', options.uid);
            }
            else {
                var $html = $('<li class="drop-menu-item item-selectable editDataLayerShape" role="presentation"><a role="menuitem">Edit</a></li>');
                $html.insertBefore($shapeLayer.find('.fit-shape'));
                $shapeLayer.attr('data-id', options.id);
                options.layerUID = '';
            }
            $shapeLayer.addClass('dmpLayer');
            $shapeLayer.data('hidden', false);
            //add labels
            $shapeLayer.find('.basicinfo-name').text(options.label || 'Parcel Layer');
            $shapeLayer.find('.adminlevels').empty();
            $shapeLayer.find('.adminlevels').append($("<div style='color:#A0A0A0;'></div>").text('Shapes: 1 ' + 'Polygon'));
            $shapeLayer.find('.basicinfo-totalGeometry, .basicinfo-type').text(1 + ' ' + MASystem.Labels.MA_Boundary);

            //store this shapeLayer on it's originating query
            $shapeLayer.attr('data-layerId',options.layerUID);
            $shapeLayer.find('.adminlevels').css('display','inline-block');
            $shapeLayer.find('.zipinfo').show();
            $shapeLayer.find('.countyinfo').show();
            $shapeLayer.find('.stateinfo').show();
            $shapeLayer.find('.shape-visibility button span').removeClass('glyphicon').addClass('MAIcon');
            $shapeLayer.find('.shape-options').find('li.edit-shape').remove();
            $shapeLayer.find('.shape-options').find('li.refresh-shape').remove();
            MA_DrawShapes.parcelHelpers.attachClickEvents(options, $shapeLayer);
            MA_DrawShapes.parcelHelpers.syncDataLayerAndShape(options, $shapeLayer);
        },
        syncDataLayerAndShape: function (options, $shapeLayer) {
            // track shape layer and data layer to remove on data layer removal
            var $dataLayer = $('#PlottedQueriesTable .DataLayer[uid="'+options.layerUID+'"]');
            var parcelBoundaries = $dataLayer.data('parcelBoundaries') || [];
            parcelBoundaries.push($shapeLayer);
            $dataLayer.data('parcelBoundaries',parcelBoundaries);
        },
        attachClickEvents: function (options, $shapeLayer) {
            $shapeLayer.off('click','.shape-visibility');
            $shapeLayer.on('click','.shape-visibility', function() {
                if($shapeLayer.data('hidden')) {
                    $(this).find('span').removeClass('ma-icon-hide').addClass('ma-icon-preview');
                    var parcel = $shapeLayer.data('proxObjects')[0];
                    MA.map.data.add(parcel[0]);
                    $shapeLayer.data('hidden', false);
                } else {
                    $(this).find('span').removeClass('ma-icon-preview').addClass('ma-icon-hide');
                    var shapeData = $shapeLayer.data() || {};
                    var parcels = shapeData.proxObjects || [];
                    $.each(parcels,function(i,parcel) {
                        try {
                            MA.map.data.remove(parcel[0]);
                        } catch(e) {
                            console.warn(e);
                        }
                    });
                    $shapeLayer.data('hidden', true);
                }
            });
            if (!options.isSavedParcel) {
                $shapeLayer.on('click','.saveDataLayerShape',function() {
                    MACustomShapes.openPopupSidebar(options);
                });
            } else {
                $shapeLayer.on('click','.editDataLayerShape',function() {
                    MACustomShapes.openPopupSidebar({id: options.id, shapeLayer: $shapeLayer});
                })
            }
        },
        drawParcelLayer: function (options, shapeData, $shapeLayer) {
            var styleOptions = {};
            if(options.colorOptions) {
                    styleOptions = {
                    fillColor : options.colorOptions.fillColor || '#000000',
                    strokeColor : options.colorOptions.borderColor || '#000000',
                    fillOpacity : options.colorOptions.fillOpacity || '0.2'
                }
            }
            var $dataLayer = $('#PlottedQueriesTable .DataLayer[uid="'+options.layerUID+'"]');
            shapeData.features[0].properties = { parcel: options.parcel, uid: options.uid, key: $dataLayer.data('key'), styleOptions : styleOptions};
            var arr = MA.map.data.addGeoJson(shapeData);
            var shape = arr;
            var proxObjects = $shapeLayer.data('proxObjects');
            proxObjects.push(shape);
        }
    },
    customShapeHelpers: {
        getLayerInfo: function (layerId) {
            var dfdInfo = jQuery.Deferred();
            var processData = {
                ajaxResource : 'MATerritoryAJAXResources',
                action: 'getTerritory',
                id: layerId
            };
            Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
                processData,
                function(response,event){
                    if (event.status) {
                        if (response && response.success) {
                            dfdInfo.resolve(response.data || {});
                        } else {
                            dfdInfo.reject('Unable to get shape info. If this issue persists, please contact support.');
                        }
                    } else {
                        dfdInfo.reject(event.message);
                    }
                }, {escape:false, buffer: false}
            );

            return dfdInfo.promise();
        },
        updateDomInfo: function ($shapeLayer, options, shapeInfo) {
            $shapeLayer.data('territoryData',shapeInfo);
            $shapeLayer.attr('data-id',shapeInfo.Id);
            $shapeLayer.find('.adminlevels').empty();
            var $territoryIcon = '<div class="ftu-icon-icon inline" type="shape"></div>';
            $shapeLayer.find('.color-box').replaceWith($territoryIcon);
            $shapeLayer.find('.svg-shape-icon').hide();
            var territoryName = shapeInfo.Name;
            var territoryDescription = (shapeInfo.Description__c == null) ? '' : shapeInfo.Description__c;
            $shapeLayer.find('.basicinfo-name').text(territoryName);
        },
        processShapes: function (shapeInfo, $shapeLayer, options) {
            var dfd = $.Deferred();
            var territory = shapeInfo.territory || {};
            var geometries = territory.sma__Geometries__r || {};
            // are we plotting 1 shape or multiple?
            if (geometries.totalSize === 0) {
                console.warn('No custom shapes found');
                dfd.reject('No geometries found for this layer.');
            } else if (geometries.totalSize === 1) {
                MA_DrawShapes.customShapeHelpers.drawSingleShape(geometries, territory, $shapeLayer, options).then(function () {
                    dfd.resolve();
                }).fail(function(err) {
                    console.warn(err);
                    dfd.reject(err);
                });
            } else {
                $shapeLayer.data('customShape_multiple', true);
                MA_DrawShapes.customShapeHelpers.drawMultipleShapes(geometries, territory, $shapeLayer, options).then(function () {
                    dfd.resolve();
                }).fail(function(err) {
                    console.warn(err);
                    dfd.reject(err);
                });
            }
            return dfd.promise();
        },
        generateGeoJSONCircle: function (center, radius, numSides) {
            var points = [],
            degreeStep = 360 / numSides;
            
            for(var i = 0; i < numSides; i++){
                var gpos = google.maps.geometry.spherical.computeOffset(center, radius, degreeStep * i);
                points.push({lng:gpos.lng(), lat:gpos.lat()});
            };
            // Duplicate the last point to close the geojson ring
            points.push(points[0]);
            return {
                type: 'Polygon',
                coordinates: points
            };
        },
        drawMultipleShapes: function (geometries, territory, $shapeLayer, options) {
            var dfd = $.Deferred();
            // treak multiple shapes as geo json
            geometries = geometries.records;
            var googleJSONLayer = new google.maps.Data({
                map: MA.map,
                customShape_multiple: true
            });
            // try to set the color 
            try {
                var colorOptions = MA_DrawShapes.customShapeHelpers.getColorOptions(territory);
                // translate border color to stroke color 
                colorOptions.strokeColor = colorOptions.borderColor || '#000000';
                googleJSONLayer.setStyle(colorOptions)
            } catch(e) {
                console.warn('Unable to set style/colors', e);
            }
            var shapeCount = {
                Circle : 0,
                Polygon : 0,
                Rectangle : 0,
                KML : 0,
                Travel : 0
            };
            for(var sL = 0, len = geometries.length; sL < len; sL++) {
                var geometry = geometries[sL];
                var jsonGeo;
                try {
                    jsonGeo = JSON.parse(geometry.sma__Geometry__c);
                } catch (e) {}
                if (jsonGeo) {
                    jsonGeo['colorOptions'] = MA_DrawShapes.customShapeHelpers.getColorOptions(territory);
                    // plot shape
                    var shapeType = jsonGeo.proximityType;
                    var enableEdit = options.enableEdit || false;
                    var shape;
                    switch (shapeType) {
                        case 'Polygon':
                            shapeCount.Polygon++;
                            shape = MA_DrawShapes.customShapeHelpers.drawPolygon(jsonGeo, $shapeLayer, territory, 'geoJSON');
                            break;
                        case 'Circle':
                            shapeCount.Circle++;
                            shape = MA_DrawShapes.customShapeHelpers.drawCircle(jsonGeo, $shapeLayer, territory, 'geoJSON');
                            break;
                        case 'Rectangle':
                            shapeCount.Rectangle++;
                            shape = MA_DrawShapes.customShapeHelpers.drawRectangle(jsonGeo, $shapeLayer, territory, 'geoJSON');
                            break;
                        default:
                            console.warn('Contains '+shapeType+' Layer. This Layer type is not supported.');
                    }
                    if (shape) {
                        googleJSONLayer.add(shape);
                    }
                } else {
                    console.warn('Unable to parse shape options', geometry);
                }
            }
            dfd.resolve();
            MA_DrawShapes.customShapeHelpers.buildShapeCountInfo(shapeCount, $shapeLayer);
            var proxObjects = $shapeLayer.data('proxObjects');
            addShapeClickEvents(googleJSONLayer);
            proxObjects.push(googleJSONLayer);
            MA_DrawShapes.customShapeHelpers.createLabelMarker(jsonGeo,googleJSONLayer,territory,$shapeLayer);
            return dfd.promise();
        },
        getColorOptions: function (territory) {
            var terrOpts = {"country":"USA","advancedOptions":{"calculateTerritoryAggregates":false,"dissolveGeometry":true},"colorOptions":{"fillColor":"#3083D3","borderColor":"#16325C","fillOpacity":"0.2","labelEnabled":false,"labelOverride":"","labelJustification":"center","labelFontSize":"10px","labelFontColor":"#FFFFFF","labelBGColor":"#000000","labelBGOpacity":"0.3"}};
            try {
                terrOpts = JSON.parse(territory.sma__Options__c);
            } catch(e) {
                console.warn('unable to parse territory options: ', territory)
            }
            return terrOpts.colorOptions;
        },
        buildShapeCountInfo: function (shapeCount, $shapeLayer) {
            var infoHtml = '<div><div>Shapes:</div>';
            for(var key in shapeCount) {
                var count = shapeCount[key];
                if(count != 0) {
                    infoHtml += '<div>'+count+' '+key+'(s)</div>';
                }
            }
            infoHtml += '</div>';
            $shapeLayer.find('.adminlevels').append($("<div style='color:#A0A0A0;'></div>").html(infoHtml));
            $shapeLayer.find('.basicinfo-totalGeometry, .basicinfo-type').text(1 + ' ' + MASystem.Labels.MA_Boundary);
            //hide dissolve, not supported
            $shapeLayer.find('#toggle-dissolve').closest('li').remove();
        },
        drawSingleShape: function (geometries, territory, $shapeLayer, options) {
            var dfd = $.Deferred();
            var shapeToArray = getProperty(geometries, 'records', false) || [];
            var geometry = shapeToArray[0];
            var shapeCount = {
                Circle : 0,
                Polygon : 0,
                Rectangle : 0,
                KML : 0,
                Travel : 0
            };
            if (geometry) {
                // parse our json options
                var jsonGeo;
                try {
                    jsonGeo = JSON.parse(geometry.sma__Geometry__c);
                } catch (e) {}
                if (jsonGeo) {
                    jsonGeo['colorOptions'] = MA_DrawShapes.customShapeHelpers.getColorOptions(territory);
                    // plot shape
                    var shapeType = jsonGeo.proximityType;
                    var enableEdit = options.enableEdit || false;
                    var shape;
                    switch (shapeType) {
                        case 'KML':
                            shapeCount.KML++;
                            MA_DrawShapes.customShapeHelpers.drawKML(jsonGeo, $shapeLayer);
                            dfd.resolve();
                            break;
                        case 'Polygon':
                            shapeCount.Polygon++;
                            shape = MA_DrawShapes.customShapeHelpers.drawPolygon(jsonGeo, $shapeLayer, territory);
                            break;
                        case 'Circle':
                            shapeCount.Circle++;
                            shape = MA_DrawShapes.customShapeHelpers.drawCircle(jsonGeo, $shapeLayer, territory);
                            break;
                        case 'Rectangle':
                            shapeCount.Rectangle++;
                            shape = MA_DrawShapes.customShapeHelpers.drawRectangle(jsonGeo, $shapeLayer, territory);
                            break;
                        case 'Parcel':
                            $shapeLayer.remove();
                            var savedShapeOptions = {
                                id : options.id,
                                label : options.label,
                                name : options.name,
                                description : options.description
                            };
                            $.extend(jsonGeo,savedShapeOptions);
                            MA_DrawShapes.init(jsonGeo);
                            // dfd.resolve();
                            break;
                        case 'travelTime':
                            //consolidate our options for here processing
                            var startLocation      = 'geo!' + jsonGeo.travelLatitude + ',' + jsonGeo.travelLongitude;
                            var legacyTravelMethod = jsonGeo.travelMode == 'drive' ? 'car' : jsonGeo.travelMode;
                            //option mode subject to change user preference have to be dynamic -travelPreference -legacyTravelMethod
                            var optionMode         = (jsonGeo.travelPreference || 'fastest') + ';' + (legacyTravelMethod || 'car') + ';' + 'traffic:'+ (jsonGeo.trafficEnabled || 'disabled');
                            var departureTime;
                            // SFCM-436, removing timezone (+10 AUS fails on HERE side)
                            if (jsonGeo.departure) {
                                departureTime = moment(jsonGeo.departure).format('YYYY-MM-DDTHH:mm:ss');
                            } else {
                                departureTime = moment().local().format('YYYY-MM-DDTHH:mm:ss');;
                            }
                            var rangeType          = jsonGeo.rangetype != undefined ? jsonGeo.rangetype : 'time';
                            var range              = jsonGeo.travelTime || '0';
                            range                  = Math.round(parseFloat(range) * 60); //convert minutes to seconds, HERE api only accept seconds
                            //options stay the same unless version changes
                            var options = {
                                subType: 'core',
                                action : 'isoline',
                                version: '1',
                                method : 'get'
                            };
                            //params support legacy custom shapes, and new custom shapes with traffic
                            /*Example for values
                             *@mode : "fastest;car;traffic:enabled", preferences and traffic enabled/disable.
                             *@start: "geo!33.86,-84.68", lat and lng of address input.
                             *@range: "1000", travel time in seconds.
                             *@rangetype: "time", either time or distance.
                             *@departure: "2017-06-01T10:04:10-04:00", iso date format.
                             */
                            var params = {
                                mode      : optionMode,
                                start     : startLocation,
                                range     : range,
                                rangetype : rangeType,
                                departure : departureTime
                            };

                            // get service area
                            var $loadingShape = MAToastMessages.showLoading({message:MASystem.Labels.MA_Loading + '...',timeOut:0,extendedTimeOut:0});
                            
                            MAPlotting.getServiceArea(options, params).then(function(res) {

                                var bounds = new google.maps.LatLngBounds();
                                var proxObjects = $shapeLayer.data('proxObjects');

                                // draw a small circle to indicate the center
                                var centerPoint = new google.maps.Marker({
                                    position: new google.maps.LatLng({lat:jsonGeo.travelLatitude, lng:jsonGeo.travelLongitude}),
                                    title: 'Travel Time Center',
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: '#ffffff', //'#E7E7E7',
                                        fillOpacity : 1,
                                        strokeColor : '#000000',
                                        strokeWeight : 1,
                                        scale: 4
                                    },
                                });

                                // include center points in bounds
                                bounds.extend(centerPoint.getPosition());

                                // create polygon objects from shapes data
                                res.shapes.forEach(function(shape) {
                                    shapeCount.Polygon++;

                                    var endpoints = shape.coordinates;

                                    var polygon = new google.maps.Polygon({
                                        path: endpoints,
                                        geodesic: true,
                                        isTravelGeom : true,
    
                                        shapeType : 'travelTime',
                                        fillColor: jsonGeo.colorOptions.fillColor,
                                        fillOpacity: jsonGeo.colorOptions.fillOpacity,
                                        strokeColor: jsonGeo.colorOptions.borderColor,
                                        isSavedTravel : true
                                    });

                                    // polygon click handlers
                                    google.maps.event.addListener(polygon, 'click', function (e) {
                                        proximityLayer_Click({ position: e.latLng, type: 'Polygon', shape: polygon });
                                    });

                                    google.maps.event.addListener(polygon, 'rightclick', function (e) {
                                        Shape_Context.call(this, e);
                                    });

                                    // cache reference to center point in each polygon for removal later
                                    polygon.centerPoint = centerPoint;

                                    proxObjects.push(polygon);

                                    // add this shapes bounds to shapes bounds union
                                    bounds.union(shape.bounds);

                                    // show polygon on map
                                    polygon.setMap(MA.map);

                                    //create shape labels
                                    var labelMarker = MACustomShapes.createLabel(jsonGeo,jsonGeo.colorOptions,polygon,territory.Name);
                                    if (jsonGeo.colorOptions.labelEnabled) {
                                        labelMarker.setVisible(true);
                                        $shapeLayer.find('#toggle-labels').attr('checked','checked');
                                    }
                                    $shapeLayer.data('labelmarkers',[labelMarker]);
                                });

                                centerPoint.setMap(MA.map);
                                MA.map.fitBounds(bounds);

                                //$proxLayer.find('.loadmask').remove();
                                MAToastMessages.hideMessage($loadingShape);
                                MA_DrawShapes.customShapeHelpers.buildShapeCountInfo(shapeCount, $shapeLayer);
                                dfd.resolve();
  
                            }).fail(function(res) {
                                MAToastMessages.hideMessage($loadingShape);
                                var errMsg = res.message || 'Unknown Error';
    
                                if(errMsg.indexOf('endpoint') > -1) {
                                    errMsg = 'Unautorized endpoint: ' + MASystem.Organization.MAIO_URL
                                }
                                
                                dfd.reject('Unable to get the service area. ' + errMsg);
                            });
                            break;
                        case 'travelDistance':
                            //consolidate our options for here processing
                            var startLocation      = 'geo!' + jsonGeo.travelLatitude + ',' + jsonGeo.travelLongitude;
                            var legacyTravelMethod = jsonGeo.travelMode == 'drive' ? 'car' : jsonGeo.travelMode;
                            //option mode subject to change user preference have to be dynamic -travelPreference -legacyTravelMethod
                            var optionMode = (jsonGeo.travelPreference || 'fastest') + ';' + (legacyTravelMethod || 'car') + ';' + 'traffic:'+ (jsonGeo.trafficEnabled || 'disabled');
                            var departureTime;
                            // SFCM-436, removing timezone (+10 AUS fails on HERE side)
                            if (jsonGeo.departure) {
                                departureTime = moment(jsonGeo.departure).format('YYYY-MM-DDTHH:mm:ss');
                            } else {
                                departureTime = moment().local().format('YYYY-MM-DDTHH:mm:ss');;
                            }
                           
                            var rangeType          = jsonGeo.rangetype != undefined ? jsonGeo.rangetype : 'distance';
                            var range              = jsonGeo.travelDistance || '0';
                            range                  = Math.round(parseFloat(range) * 1609.34); //convert miles to meters, HERE only accept meter as distance.

                            //options stay the same unless version changes
                            var options = {
                                subType: 'core',
                                action : 'isoline',
                                version: '1',
                                method : 'get'
                            };
                            //params support legacy custom shapes, and new custom shapes with traffic
                            /*Example for values
                             *@mode : "fastest;car;traffic:enabled", preferences and traffic enabled/disable.
                             *@start: "geo!33.86,-84.68", lat and lng of address input.
                             *@range: "1000", distance in meters.
                             *@rangetype: "distance", either time or distance.
                             *@departure: "2017-06-01T10:04:10-04:00", iso date format.
                             */
                            var params = {
                                mode      : optionMode,
                                start     : startLocation,
                                range     : range,
                                rangetype : rangeType,
                                departure : departureTime
                            };

                            var $loadingShape = MAToastMessages.showLoading({message:MASystem.Labels.MA_Loading + '...',timeOut:0,extendedTimeOut:0});
                            // update status
                            //$loadingShape.find('.toast-title').text('Calculating Travel Distance...');
                             shapeCount.Polygon++;
                            // get service area
                            MAPlotting.getServiceArea(options, params,function(res) {
                                if(res && res.success)
                                {
                                   var bounds = res.bounds; //google boundaries
                                   var endpoints = res.points; //array of lats & lngs

                                   if(Array.isArray(endpoints)) {

                                        var boundary = new google.maps.Polygon({
                                            path: endpoints,
                                            geodesic: true,
                                            isTravelGeom : true,
                                            shapeType : 'travelDistance',
                                            fillColor: jsonGeo.colorOptions.fillColor,
                                            fillOpacity: jsonGeo.colorOptions.fillOpacity,
                                            strokeColor: jsonGeo.colorOptions.borderColor,
                                            isSavedTravel : true
                                        });

                                       // save to DOM
                                       //$proxLayer.data('proxObject', boundary);

                                        //handle clicking on polygon
                                        google.maps.event.addListener(boundary, 'click', function (e) {
                                            proximityLayer_Click({ position: e.latLng, type: 'Polygon', shape: boundary });
                                        });
                                        google.maps.event.addListener(boundary, 'rightclick', function (e) {
                                            Shape_Context.call(this, e);
                                        });


                                         // this displays a center for the plotted boundary
                                        var centerPoint = new google.maps.Marker({
                                            position: new google.maps.LatLng({lat:jsonGeo.travelLatitude, lng:jsonGeo.travelLongitude}),
                                            title: 'Travel Distance Center',
                                            icon: {
                                                path: google.maps.SymbolPath.CIRCLE,
                                                fillColor: '#ffffff', //'#E7E7E7',
                                                fillOpacity : 1,
                                                strokeColor : '#000000',
                                                strokeWeight : 1,
                                                scale: 4
                                            },
                                        });

                                        bounds.extend(centerPoint.getPosition());
                                        boundary.centerPoint = centerPoint;


                                        boundary.setMap(MA.map); // assign boundary shape to map
                                        centerPoint.setMap(MA.map); // display center point
                                        var proxObjects = $shapeLayer.data('proxObjects');
                                        proxObjects.push(boundary);
                                        MA.map.fitBounds(bounds);

                                        //create shape labels
                                        var labelMarker = MACustomShapes.createLabel(jsonGeo,jsonGeo.colorOptions,boundary,territory.Name);
                                        if (jsonGeo.colorOptions.labelEnabled) {
                                            labelMarker.setVisible(true);
                                            $shapeLayer.find('#toggle-labels').attr('checked','checked');
                                        }
                                        $shapeLayer.data('labelmarkers',[labelMarker]);

                                       //$proxLayer.find('.loadmask').remove();
                                       MAToastMessages.hideMessage($loadingShape);
                                       MA_DrawShapes.customShapeHelpers.buildShapeCountInfo(shapeCount, $shapeLayer);
                                       // callback({success:true});
                                       dfd.resolve();
                                   }
                                   else
                                   {
                                        //$proxLayer.find('.loadmask').remove();
                                        MAToastMessages.hideMessage($loadingShape);
                                        //MAToastMessages.showError({message:'Unable to find boundary points.'});
                                        dfd.reject('Unable to find boundary points.');
                                       //  callback({success:false, message:'Unable to find boundary points.'});
                                   }
                                }
                                else
                                {
                                    //$proxLayer.find('.loadmask').remove();
                                    MAToastMessages.hideMessage($loadingShape);
                                    //MAToastMessages.showError({message:'Unable to retreive boundary.', subMessage:'Please try again.'});
                                    dfd.reject('Unable to find boundary points.');
                                    // callback({success:false, message:'Unable to retreive the service area.'});
                                }
                            });
                            break;
                    }
                    if (shape) {
                        dfd.resolve();
                        MA_DrawShapes.customShapeHelpers.buildShapeCountInfo(shapeCount, $shapeLayer);
                        var proxObjects = $shapeLayer.data('proxObjects');
                        addShapeClickEvents(shape);
                        proxObjects.push(shape);
                        MA_DrawShapes.customShapeHelpers.createLabelMarker(jsonGeo,shape,territory,$shapeLayer);
                        if(enableEdit) {
                            //get the shape, just the first one for now
                            shape.setEditable(true);
                        }
                    }
                } else {
                    console.warn('Unable to parse shape options', geometry);
                }
            }
            return dfd.promise();
        },
        createLabelMarker: function (jsonGeo,shape,territory,$shapeLayer) {
            //create shape labels
            var labelMarker = MACustomShapes.createLabel(jsonGeo,jsonGeo.colorOptions,shape,territory.Name);
            if (jsonGeo.colorOptions.labelEnabled) {
                labelMarker.setVisible(true);
                $shapeLayer.find('#toggle-labels').attr('checked','checked');
            }
            $shapeLayer.data('labelmarkers',[labelMarker]);
        },
        drawKML: function (jsonGeo, $shapeLayer) {
            var requestURL;
            if(!jsonGeo.kmlResourceType) {
                requestURL = MA.resources.XMLDoc+'?resourceType=Document&docId='+jsonGeo.id;
            }
            else
            {
                requestURL = MA.resources.XMLDoc+'?resourceType=' + jsonGeo.kmlResourceType + '&docId='+jsonGeo.id;
            }            
            new ZipFile(requestURL, function(zip)
            {
                // Set the file type to KML if we failed to unzip the requested URL.
                var type = zip.status.length > 0 ? 'KML' : 'KMZ';
                // use geoxml3 to parse
                var kmlLayer = new geoXML3.parser({
                    map: MA.map,
                    forceType: type,
                    processStyles: true,
                    singleInfoWindow: true,
                    afterParse: function ()
                    {
                        ChangeVisibilityWhenCircleIsAdded();
                        $shapeLayer.find('.loadmask').remove();

                        //keep track of this layer so we can remove it later
                        $shapeLayer.data('kmlLayer', kmlLayer);
                    },
                    failedParse: function ()
                    {
                        MA.log('Unable to parse: ' + MA.resources.XMLDoc+'?docId='+$shapeLayer.find('.options-kml-document').val());
                        var message = 'Unable to retreive or parse the KML document.';
                        MAToastMessages.showError({'message':message,timeOut:6000});
                        $shapeLayer.find('.loadmask').remove();
                    }
                });

                kmlLayer.parse(requestURL);

                //hide options for shapelayer
                $shapeLayer.find('#toggle-labels').closest('li').remove();
                $shapeLayer.find('#limit-within-shape').closest('li').remove();
            });
        },
        drawCircle: function (jsonGeo, $shapeLayer, territory, shapeType) {
            //get the center and radius
            shapeType = shapeType || 'standard'
            var center = new google.maps.LatLng(parseFloat(jsonGeo.center.lat), parseFloat(jsonGeo.center.lng));
            var qid = $shapeLayer.attr('qid');
            // shapeCount.Circle++;
            //create a prox circle and add it to the map
            var shape;
            if (shapeType === 'geoJSON') {
                var convertCoords = MA_DrawShapes.customShapeHelpers.generateGeoJSONCircle(center, jsonGeo.radius, 50);
                shape = {
                    geometry: new google.maps.Data.Polygon([convertCoords.coordinates])
                }
            } else {
                shape = new google.maps.Circle({
                    map: MA.map,
                    center: center,
                    radius: jsonGeo.radius,
                    layerType: 'prox',
                    strokeColor: jsonGeo.colorOptions.borderColor,
                    strokeWeight: 3,
                    strokeOpacity: 1,
                    fillColor: jsonGeo.colorOptions.fillColor,
                    fillOpacity: jsonGeo.colorOptions.fillOpacity,
                    qid : qid,
                    isCustom : true,
                    label : territory.Name,
                    zIndex : 1000
                });
            }
            return shape;
        },
        drawPolygon: function (jsonGeo, $shapeLayer, territory, shapeType) {
            var shape;
            if(jsonGeo.points) {
                var qid = $shapeLayer.attr('qid');
                if (shapeType === 'geoJSON') {
                    shape = {
                        geometry: new google.maps.Data.Polygon([jsonGeo.points])
                    }
                } else {
                    shape = new google.maps.Polygon({
                        paths: jsonGeo.points,
                        strokeColor: jsonGeo.colorOptions.borderColor,
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        fillColor: jsonGeo.colorOptions.fillColor,
                        fillOpacity: jsonGeo.colorOptions.fillOpacity,
                        map : MA.map,
                        qid : qid,
                        isCustom : true,
                        label : territory.Name,
                        zIndex : 1000
                    });
                }
            }
            return shape;
        },
        drawRectangle: function (jsonGeo, $shapeLayer, territory, shapeType) {
            var shape;
            if(jsonGeo.bounds) {
                //create the lat lng bounds
                var point1 = new google.maps.LatLng(jsonGeo.bounds.NE.lat,jsonGeo.bounds.NE.lng);
                var point2 = new google.maps.LatLng(jsonGeo.bounds.SW.lat,jsonGeo.bounds.NE.lng);
                var point3 = new google.maps.LatLng(jsonGeo.bounds.SW.lat,jsonGeo.bounds.SW.lng);
                var point4 = new google.maps.LatLng(jsonGeo.bounds.NE.lat,jsonGeo.bounds.SW.lng);
                var qid = $shapeLayer.attr('qid');
                if (shapeType === 'geoJSON') {
                    shape = {
                        geometry: new google.maps.Data.Polygon([[point1,point2,point3,point4]])
                    }
                } else {
                    var bounds = new google.maps.LatLngBounds(
                        point3,
                        point1
                    );
                    shape = new google.maps.Rectangle({
                        strokeColor: jsonGeo.colorOptions.borderColor,
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        fillColor: jsonGeo.colorOptions.fillColor,
                        fillOpacity: jsonGeo.colorOptions.fillOpacity,
                        map : MA.map,
                        bounds : bounds,
                        qid : qid,
                        isCustom : true,
                        label : territory.Name,
                        zIndex : 1000
                    });
                }
            }
            return shape;
        }
    }
};

function drawShapeLayer (options,callback)
{
    console.warn('function deprecated, use MA_DrawShapes.init();')
    callback=callback || function(){};
    MA_DrawShapes.init(options).then(function(res) {
        callback({success:true});
    }).fail(function (err) {
        callback({success:false});
    });
    return;
}

function normalizeShapeData(options) {
    
    var country = getProperty(options, 'data.country', false);
    var postBody = {
        "format": "GeoJSON",
        "apitoken": options.APIKey || MA.APIKey|| ''
    };
    if (country == 'shapesV2') {
        //update old structure to pass to new endpoint
        postBody.geoids = getProperty(options, 'data.ids').split(',') || [];
		postBody.merged = getProperty(options, 'data.dissolve', false) || false;
    }
    else {
        postBody.geoids = getProperty(options, 'data.ids').split(',') || [];
		postBody.merged = getProperty(options, 'data.dissolve', false) || false;
    }
    
    return postBody;
}

function GetDataFromServer(options) {
    
	$.extend({
		data: {}
	}, options || {});
	options.tryOld = true;
	var dfd = $.Deferred();
	
	var $layer = options.layer;
    if($layer) {
        $layer.find('.plottinginfo-wrapper .inline').eq(1).text('Loading...');
    }
	
	//normalize our data from legacy use cases
	var postBody = normalizeShapeData(options);
	
	//send request for territory info
	var processData = {
		subType: 'boundary',
		action: 'geography',
		version: '1',
		returnJSONString: 'true' //used to reduce heap size
	};
	Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
		processData,
		JSON.stringify(postBody),
		function(response, event) {
		    handleGetBoundaryData(response, event, options).then(function (res) {
		        dfd.resolve(res);
		    });
		}, {buffer: false,escape: false,timeout: 120000}
	);
	return dfd.promise();
}

function handleGetBoundaryData (response,event,options) {
    //breaking this out because of heap size
    //try SF Remote, then ajax(ajax is often blocked, so using sf first)
    var dfd = $.Deferred();
    
    var $layer = options.layer;
    if($layer) {
        $layer.find('.plottinginfo-wrapper .inline').eq(1).text('');
    }
    
    var kmlInfo = options.layer.data('kmlInfo') || [];
    if (event.status) {
		if (response.success)
		{
        	var labelArray = [];
        	var resData = response.data || '{}';
        	//parse the data from server here to reduce heap size
        	var parsedData = {};
        	if(typeof(resData) === 'string') {
        	    try{
            		var stringData = response.data || '{}';
            		parsedData = JSON.parse(stringData);
            	}
            	catch(e) {
            		MAToastMessages.showError({message:'Unable to process Layer',subMessage:'Please reduce the total number of shapes and try again.',timeOut:8000});
            		dfd.resolve({
            			success: false
            		});
            		MA.log(e);
            	}
        	}
        	else {
        	    //if we processed this on the page side, it will not be a string
        	    //just update our var and pass it on
        	    parsedData = resData;
        	}
        	
        	resData = getProperty(parsedData, 'data', false) || [];
        	$.each(resData, function(k, v) {
        		$.each(v.geojson.features, function(kk, vv) {
        			var theData = vv;
        
        			//build geoJSON return values and add to map
        			options.layer.data('dataLayer').addGeoJson(theData);
        			kmlInfo.push(theData);
        			options.layer.data('kmlInfo', kmlInfo);
        			if (true) {
        				//var features = getProperty(vv,'geojson.features',false) || [];
        				var labelPosition = getProperty(v, 'label_position');
        
        				var labelLat = getProperty(labelPosition, options.data.labelposition + '.lat', false);
        				var labelLng = getProperty(labelPosition, options.data.labelposition + '.lng', false);
        
        				var labelText = getProperty(vv, 'properties.label', false);
        
        				if (labelText == 'Merged Shape') {
        					//grab the shape label
        					var labelOver = options.data.labelOverride;
        					labelText = labelOver == '' ? options.data.name : labelOver;
        				}
        
        				var labelObject = {
        					lat: labelLat,
        					lng: labelLng,
        					text: labelText
        				}
        				labelArray.push(labelObject);
        			}
        		});
        	});
        	if (options.layer.data('labels') == undefined) {
        		options.layer.data('labels', []);
        	}
        	var previousLabels = options.layer.data('labels');
        	var joinedLabels = previousLabels.concat(labelArray);
        	options.layer.data('labels', joinedLabels);
        	dfd.resolve({
        		geomLabels: getProperty(parsedData, 'geomLabels', false),
        		success: true
        	});
        } else {
            MAToastMessages.showError({ message: 'Unable to process Layer', subMessage: 'Please reduce the total number of shapes and try again.', timeOut: 8000 });
            dfd.resolve({success: false});
        }
    }
    else {
        var errMsg = event.message || 'Unknown error';
        if (errMsg.indexOf('heap size') > -1) {
            errMsg = 'Please reduce the total number of shapes and try again.'
        }
        MAToastMessages.showError({ message: 'Unable to process Layer', subMessage: errMsg, timeOut: 8000 });
        dfd.resolve({
            success: false
        });
	}
    return dfd.promise();
}

function getboundaryInfo(options)
{
	//default options
	options = $.extend({
		forClone: false
	}, options || {});
	//show loading
	//showLoading($('#CreateTerritoryPopup .territory-popup.loadmask-wrapper'), 'Loading...');
	showLoading($('#CreateTerritoryPopup'), 'Loading Salesforce Data',0);

	//if this is a clone, we need to remove the territory id (so an insert is performed)
	var territoryId = $('#CreateTerritoryPopup').data('territoryId');
	if (options.forClone) {
		$('#CreateTerritoryPopup').removeData('territoryId');
	}
	//send request for territory info
    var processData = {
        ajaxResource : 'MATerritoryAJAXResources',
        action: 'getTerritory',
        id: territoryId
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(response,event){
            hideMessage($('#CreateTerritoryPopup'));
            showLoading($('#CreateTerritoryPopup'), 'Updating Salesforce Data',0);
            if(event.status) {
            	removeNamespace(MASystem.MergeFields.NameSpace, response.data.territory);
            	removeNamespace(MASystem.MergeFields.NameSpace, response.data.territory.Geometries__r.records[0]);

            	//add label and system info to territory
            	if (options.forClone) {
            	    $('#CreateTerritoryPopup .territory-name').val('Copy of ' + response.data.territory.Name);
            	}
            	else {
            	    $('#CreateTerritoryPopup .territory-name').val(response.data.territory.Name);
            	}
            	$('#CreateTerritoryPopup .territory-description').val((response.data.territory.Description__c == null) ? '' : response.data.territory.Description__c);
            	$('#CreateTerritoryPopup .systeminfo').text('***Created By ' + response.data.territory.CreatedBy.Name + ' on ' + moment(response.data.territory.CreatedDate).format(formatUserLocaleDate({ moment: true })) + ', Modified By ' + response.data.territory.LastModifiedBy.Name + ' on ' + moment(response.data.territory.LastModifiedDate).format(formatUserLocaleDate({ moment: true })));

            	//grab colors
            	var Options = JSON.parse(response.data.territory.Options__c) || { country: 'USA', colorOptions: { fillColor: '#3083d3', borderColor: '#16325C', fillOpacity: 0.2 } };
            	var country = Options.country || 'USA';
            	var fillColor = Options.colorOptions.fillColor;
            	var borderColor = Options.colorOptions.borderColor;
            	var fillOpacity = Options.colorOptions.fillOpacity || 0.2;

            	$('#CreateTerritoryPopup .territory-country').val(country).change();
            	$('#CreateTerritoryPopup .fillcolor')[0].color.fromString(fillColor);
            	$('#CreateTerritoryPopup .bordercolor')[0].color.fromString(borderColor);
            	$('#CreateTerritoryPopup .fillopacity').val(fillOpacity);


            	//New Options added on 4/7/2015
            	var labelEnabled        = Options.colorOptions.labelEnabled        || false;
            	var labelOverride       = Options.colorOptions.labelOverride       || '';
            	var labelJustification  = Options.colorOptions.labelJustification  || 'center';
            	var labelFontSize       = Options.colorOptions.labelFontSize       || '10px';
            	var labelFontColor      = Options.colorOptions.labelFontColor      || '#FFFFFF';
            	var labelBGColor        = Options.colorOptions.labelBGColor        || '#000000';
            	var labelBGOpacity      = Options.colorOptions.labelBGOpacity      || '0.2';
                var disGeo              = Options.advancedOptions.dissolveGeometry || false;
                var affectVisibility    = Options.advancedOptions.affectVisibility || false;
            	$('#shapelayer-label-enabled').prop('checked', labelEnabled);
            	$('#shapelayer-label-override').val(labelOverride);
            	$('#shapelayer-label-justification').val(labelJustification);
            	$('#shapelayer-label-font-size').val(labelFontSize);
            	$('#shapelayer-label-font-color')[0].color.fromString(labelFontColor);
            	$('#shapelayer-label-bg-color')[0].color.fromString(labelBGColor);
            	$('#shapelayer-label-bg-opacity').val(labelBGOpacity);
                $('#CreateTerritoryPopup .dissolve-geometry').prop('checked', disGeo);
                $('#CreateTerritoryPopup .affect-visibility').prop('checked', affectVisibility);
                //grab advanced options
            	Options.advancedOptions = $.extend({
            		calculateTerritoryAggregates: false,
            		dissolveGeometry: false
            	}, Options.advancedOptions);
            	$('#CreateTerritoryPopup .calculate-territory-aggregates').prop('checked', false);// Options.advancedOptions.calculateTerritoryAggregates);

            	//determine which data types we need to request boundary data for
            	var geometries = getProperty(response || {}, 'data.territory.Geometries__r.records',false) || [];
            	var geoRecord = geometries[0] || {};
            	var unParsedGeometry = geoRecord.Geometry__c || '{}';
            	var geometry;
            	try {
            	    geometry = JSON.parse(unParsedGeometry);
            	}
            	catch(e) {
            	    MA.log('Unable to parse custom shape info',e);
            	    MA.log(unParsedGeometry);
            	}
            	var ids = [];
            	if (geometry) {
            		$.each(geometry, function (adminLevel, boundaries)
            		{
    					//legacy support for old admin level keys
    					if (adminLevel == 'states') { adminLevel = '1'; }
    					else if (adminLevel == 'counties') { adminLevel = '2'; }
    					else if (adminLevel == 'zips') { adminLevel = '4'; }

            			//legacy support for old county format
            			if (country == 'USA' && adminLevel == '2') {
            				$.each(boundaries, function (index, boundary) {
            					if (boundary.indexOf('USA-2-') == 0) {
            						ids.push(boundary);
            					}
            					else {
            						ids.push('USA-2-' + boundary.substring(4));
            					}
            				});
            			}
            			else {
                            //case 00024001, remove space add underscore
                            var spacedCountryPrefix = ['SWE'];
                            $.each(boundaries, function (index, boundary) {
                                var boundaryParts = boundary.split('-');
                                if(spacedCountryPrefix.indexOf(boundaryParts[0]) == -1) {
                                    boundary = boundary.replace(/ +(?= )/g,'').replace(/ /g,"_");
                                } 
                                ids.push(boundary);
                            });
            			}
            		});
            	}

                /****************************************************
                 * Creating batch to speed up response times
                 * loading over 200+ shapes would take over 20 seconds
                 * batching reduces to ~6-10
                *****************************************************/
                var batchIds = MA.Util.createBatchable(ids,100);
    			var processData = {
                    subType: 'boundary',
                    action: 'search',
                    version: '1'
				};

				var shapeData = [];
				var totalBatch = 0;
				var batchFinish = 0;
				var percentDone = 0;
				var finalLoad = showLoading($('#CreateTerritoryPopup'), 'Retrieving latest information... '+percentDone+'%',0);
				var geoQ = async.queue(function (options, callback) {
				    var geoIdFilter = [{
    					field_id:"geoid",
    					values:options.idsToSend
    				}];
    				var postBody = {
    					overlay:"*",
    					level:"*",
    					filters:geoIdFilter
    				}
				    Visualforce.remoting.Manager.invokeAction(MARemoting.MapAnythingIORequestPOST,
        				processData,JSON.stringify(postBody),
        				function(response, event) {
        				    batchFinish++;
        				    percentDone = Math.round((batchFinish/totalBatch)*100);
        				    finalLoad.find('.status span').not('.MA2-loader').text('Retrieving latest information... '+percentDone+'%');
        				    if(event.status) {
                                if(response && response.success) {

                                    var geoData = getProperty(response,'data.geoids',false) || [];

                                    $.each(geoData,function(k,v)
                                    {
                                    	shapeData.push({
                                    		level: "1",
                                    		uniqueid: v.value,
                                    		uniquelabel: v.label
                                    	});
                                    });
                                    callback();
                                }
                                else {
                                    MA.log(response);
                                    callback();
                                }
        				    }
        				    else {
        				        MA.log(event);
        				        callback();
        				    }
        				},{escape:false,buffer:false,timeout:45000}
        			);
				});

				geoQ.concurrency = 5;
                if(batchIds.length > 0){
                    for(var i = 0; i < batchIds.length; i++) {
				    totalBatch++;
				    geoQ.push({idsToSend:batchIds[i]});
				    }
                } else {
                    geoQ.push({idsToSend:[]});
                }
				

				geoQ.drain = function() {
				    hideMessage(finalLoad);
                    var $selectedBoundries = $('#shapeBuilderSelectedShapesColumn .slds-select');
                    processTerritoryHTML('modal',shapeData).then(function(res) {
                        optionsString = res.htmlString;
                        var $OptionsHolder = $('<select>');//We are just creating a jquery holder for our options so we can sort them before displaying them to the user.
                        $OptionsHolder.html(optionsString);
                        var my_options = $OptionsHolder.find('option');
                        my_options.sort(function(a,b) {
                            if (a.text > b.text) return 1;
                            if (a.text < b.text) return -1;
                            return 0
                        });
                        $selectedBoundries.empty().append( my_options );//.html(optionsString);
                        MALassoShapes.selectedShapeMap = res.formattedShapeMap || {};
                        shapeLayerBuilderDetailsCompletionCheck();
                    });

                    //deafault country select to USA
                    $('#shapeLayerBuilderInputCountry').val('USA').change();

                    //MAP-3576, country change has a disolve trigger in it
                    // moving here to update after country chagne
                    var disGeo = getProperty(Options, 'advancedOptions.dissolveGeometry') || false;
                    $('#CreateTerritoryPopup .dissolve-geometry').prop('checked', disGeo);
				};
           	}
           	else {
           	    hideMessage($('#CreateTerritoryPopup'));
           	}
        },
		{escape:false}
    );
}

function deleteboundary(obj)
{
	var processData = {
        ajaxResource : 'MATerritoryAJAXResources',

        action: 'deleteTerritoryFolder',
        folderId : $(obj).attr('id')
    };

    Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
        processData,
        function(response,event){
            if(event.status) {
                //do nothing
            }
		},
		{escape:false}
	);
}

function validateShapeLayer(){

    //var validLayer = false;
    //changing to true... this would always fail?
    var validLayer = true;

    //We need to make sure we have a name for our shape layer.
    $('#CreateTerritoryPopup .territory-name').removeClass('error');
    if($('#CreateTerritoryPopup .territory-name').val() == '') {
	    $('#CreateTerritoryPopup .territory-name').addClass('error');
        //alert('Please enter a label for this shape layer.');
        //$('#CreateTerritoryPopup .territory-name').closest('.slds-form-element').append('<div class="territory-name-error-message" class="slds-form-element__help">This field is required</div>');
        MAToastMessages.showWarning({message:'Validation Waring',subMessage:'A name is required.',timeOut:5000,extendedTimeOut:0,closeButton:true});
        validLayer = false;
		$('#shapeBuilderNavDetails').click();
		return validLayer;
    }
    
    if($('#CreateTerritoryPopup .territory-name').val().length > 80)
    {
        $('#CreateTerritoryPopup .territory-name').addClass('error');
        MAToastMessages.showWarning({message:'Validation Warning',subMessage:'Layer Name cannot be more than 80 characters.', timeOut:5000, extendedTimeOut:0,closeButton:true});
        validLayer = false;
        $('#shapeBuilderNavDetails').click();
		return validLayer;
    }

	//We need to make sure that the user has selected values before we can save.
	var selectedShapes = MALassoShapes.selectedShapeMap || {};
	var keys = Object.keys(selectedShapes);
	var keyLength = keys.length;
	if(keyLength > 0) {
	    //loop over our keys and make sure some are active
	    var foundShape = false;
	    $.each(selectedShapes, function(key,shapeInfo) {
	        if(shapeInfo != undefined && shapeInfo.isActive) {
	            foundShape = true;
	            return false;
	        }
	    });

	    if(foundShape) {
    	    $('#shapeBuilderSelectedShapesColumn .slds-select').removeClass('error');
    	    validLayer = validLayer != false ? true : false;
	    }
	    else {
	        validLayer = false;
	        $('#shapeBuilderSelectedShapesColumn .slds-select').addClass('error');
	        MAToastMessages.showWarning({message:'Validation Waring',subMessage:'At least 1 selected shape is required',timeOut:5000,extendedTimeOut:0,closeButton:true});
	    }
	}
	else
	{
	    $('#shapeBuilderNavShapeSelection').click();
	    $('#shapeBuilderSelectedShapesColumn .slds-select').addClass('error');
	    MAToastMessages.showWarning({message:'Validation Waring',subMessage:'At least 1 selected shape is required',timeOut:5000,extendedTimeOut:0,closeButton:true});
		//alert('Please enter a label for this shape layer.');
		validLayer = false;

	}
    return validLayer;
}
function saveBoundary(plotAfterSave)
{
    var dfd = jQuery.Deferred();

    //$('#CreateTerritoryPopup').data('folder-id', MALayers.currentFolder);
	//check for name and proper values
// 	if($('#CreateTerritoryPopup .territory-name').val() == '') {
// 	    $('#CreateTerritoryPopup .territory-name').addClass('error');
// 		alert('Please enter a label for this shape layer.');
// 	}
    if(!validateShapeLayer()){
        dfd.resolve({success:false});
    }
	else
	{
	    var boundaryData = $('#CreateTerritoryPopup').data() || {};
	    $('#CreateTerritoryPopup .territory-name').removeClass('error');
		//show saving
		//showLoading($('#CreateTerritoryPopup .territory-popup.loadmask-wrapper'), 'Saving...');

		//check for folder and user permissions
		var userId;
		var folderId;
		var territoryId;
		if (boundaryData['territoryId']) {
			territoryId = boundaryData['territoryId']
		}
		else
		{
			if($('#CreateTerritoryPopup').data('folderId') == 'PersonalRoot' || $('#CreateTerritoryPopup').data('folderId') == 'RoleUserFolder') {
				userId = MA.CurrentUser.Id;
			}
			else if ($('#CreateTerritoryPopup').data('folderId') == 'CorporateRoot') {
				//send nothing for corporate root
			}
			else {
				folderId = $('#CreateTerritoryPopup').data('folderId');
			}
		}

		//build the geometry to save
		var geometrySelection = {};
		//instead of looping over our selection, let's loop over our map,
		//the transferandsave function is hit or miss right now
		if(typeof MALassoShapes.selectedShapeMap == 'object') {
    		var keys = Object.keys(MALassoShapes.selectedShapeMap);
    		$.each(MALassoShapes.selectedShapeMap, function (key,shapeInfo) {
    		    if(shapeInfo != undefined && shapeInfo.isActive) {
    			    geometrySelection[shapeInfo.level] = geometrySelection[shapeInfo.level] || [];
    			    geometrySelection[shapeInfo.level].push(key);
    		    }
    		});
		}
		else {
		    //fall back to just looping over our selections
		    $.each($('#shapeBuilderSelectedShapesColumn .slds-select option'), function (value, option) {
    			var optionLevel = $(option).attr('data-level');
    			geometrySelection[optionLevel] = geometrySelection[optionLevel] || [];
    			geometrySelection[optionLevel].push($(option).val());
    		});
		}

		//build options
		var options = {
			country: 'shapesV2',//$('#CreateTerritoryPopup .territory-country').val(),
			advancedOptions: {
				calculateTerritoryAggregates: false,//$('#CreateTerritoryPopup .calculate-territory-aggregates').is(':checked'),
				dissolveGeometry: $('#CreateTerritoryPopup .dissolve-geometry').is(':checked'),
				affectVisibility: $('#CreateTerritoryPopup .affect-visibility').is(':checked')
			}
		};
		var colorOptions = {
			fillColor: $('#CreateTerritoryPopup .fillcolor').val(),
			borderColor: $('#CreateTerritoryPopup .bordercolor').val(),
			fillOpacity: $('#CreateTerritoryPopup .fillopacity').val(),

			labelEnabled: $('#shapelayer-label-enabled').is(':checked'),
			labelOverride: $('#shapelayer-label-override').val(),
			labelJustification: $('#shapelayer-label-justification').val(),
			labelFontSize: $('#shapelayer-label-font-size').val(),
			labelFontColor: $('#shapelayer-label-font-color').val(),
			labelBGColor: $('#shapelayer-label-bg-color').val(),
			labelBGOpacity: $('#shapelayer-label-bg-opacity').val(),
		};
		options.colorOptions = colorOptions;

		//save info and close popup
		var shapeDescription = $('#shapeBuilderDrawingModePanelWrap').hasClass('in') ? $('#shapeBuilderDetailsNameDrawingMode').data('description') : $('#CreateTerritoryPopup .territory-description').val();
        var processData = {
            ajaxResource : 'MATerritoryAJAXResources',

            action: 'saveBoundaryInfo',
            serializedTerritory : JSON.stringify(addNamespace(MASystem.MergeFields.NameSpace, {
				Name : $('#CreateTerritoryPopup .territory-name').val(),
				Description__c : shapeDescription,
				User__c : userId,
				Folder__c : folderId,
				Id : territoryId,
				Options__c : JSON.stringify(options)
			})),
			serializedGeometry : JSON.stringify(addNamespace(MASystem.MergeFields.NameSpace, {
				Name : $('#CreateTerritoryPopup .territory-name').val() + '-geometry',
				Geometry__c : JSON.stringify(geometrySelection)
			}))
        };

        Visualforce.remoting.Manager.invokeAction(MARemoting.processAJAXRequest,
            processData,
            function(response,event){
                if(event.status) {
                	if (!response.success) {
                	    if($('.territory-description').val().length > 255) {
                            MAToastMessages.showError({
                                message: 'Save Error',
                                subMessage: 'Description cannot exceed 255 characters. Currently used ' + $('.territory-description').val().length,
                                closeButton: true,
                                timeOut: 10000
                            });
                        } else {
                            var errMsg = response.message || 'Unable to save.  Please remove some boundaries and try again.';
                            MAToastMessages.showError({
                                message: 'Save Error',
                                subMessage: errMsg,
                                closeButton: true,
                                timeOut: 10000
                            });
                	    }

                		return;

                	}

                	removeNamespace(MASystem.MergeFields.NameSpace, response.data);

                	//grab color options
                	var options = JSON.parse(response.data.Options__c);
                	var colorOptions = options.colorOptions;

                	//hide saving
                	hideMessage($('#CreateTerritoryPopup .territory-popup.loadmask-wrapper'));


                	if (NewLayerNavigationEnabled())
                	{
                	    MALayers.refreshFolder();
                	}
                	else
                	{
    	            	//add to tree or update
    	            	if ($('#CreateTerritoryPopup').data('territoryId'))
    	            	{
    	            		//update
    	            		var $node = $('#SQTree li[id="'+response.data.Id+'"]');
    	            		$node.attr('iconcolor', colorOptions.fillColor);
    	            		$("#SQTree").jstree('rename_node', '#' + $('#CreateTerritoryPopup').data('territoryId') , response.data.Name);
    	            		updateIcon($node);
    	            	}
    	            	else
    	            	{
    	            		if ($('#CreateTerritoryPopup').data('folderId') == 'RoleUserFolder') {
    	            			$("#SQTree").jstree("create","#" + $('#CreateTerritoryPopup').data('folderIdActual'),"last",{attr : {id: response.data.Id, iconcolor: colorOptions.fillColor, NodeType: 'PersonalTerritory', rel: 'SavedTerritory', title: response.data.Name, isCustom: 'false'}, data: response.data.Name},null,true);
    	            		}
    	            		else {
    	            			$("#SQTree").jstree("create","#" + $('#CreateTerritoryPopup').data('folderId'),"last",{attr : {id: response.data.Id, iconcolor: colorOptions.fillColor, NodeType: 'PersonalTerritory', rel: 'SavedTerritory', title: response.data.Name, isCustom: 'false'}, data: response.data.Name},null,true);
    	            		}
    					}
                	}

                    clearGeometryInfo();
                    
                    if (plotAfterSave) $('#layer-tab-nav-plotted').click();
                	
                	//plot layer if needed
                	if (plotAfterSave) {
                	    //$('.js-show-shape-builder-manual-mode').click();
                	    closeManualShapeDraw();
                	    closeShapeLayerBuilder();

                	    $('.PlottedShapeLayer.maTerritory').each(function(){
                	    if($(this).attr('data-id') == response.data.Id)
                	    {
                	        $(this).find('.btn-remove').click();
                	    }

                	    })
                		MA_DrawShapes.init({ id : response.data.Id, modify: (boundaryData.modify || false) });
                	} else
                	{
                	    closeManualShapeDraw();
                	    closeShapeLayerBuilder();
                	}
    			}
    			dfd.resolve({success:true});
            },
			{escape:false}
		);
	}
	return dfd.promise();
}

function clearCustomShapeInfo() {
    selectedGeometry = {};
	$('#CustomShapePopup .folders-tab').show();
    $('#CustomShapePopup a[href="#tab-folders"]').click();
	$('#CustomShapePopup').removeData();
	$('#CustomShapePopup .shape-name').val('');
	$('#CustomShapePopup .shape-description').val('');
	$('#CustomShapePopup .systeminfo').text('');
	$('#CustomShapePopup .search-input').val('').blur();
	$('#CustomShapePopup .fillcolor')[0].color.fromString('#3083d3');
    $('#CustomShapePopup .bordercolor')[0].color.fromString('#16325C');
    $('#CustomShapePopup .fillopacity').val('0.2');
    $('#CustomShapePopup #tabs').show();
    $('#CustomShapePopup').removeClass('isKML');
    $('#custom-shapelayer-label-enabled').prop('checked', false);
	$('#custom-shapelayer-label-override').val('');
	$('#custom-shapelayer-label-justification').val('center');
	$('#custom-shapelayer-label-font-size').val('10px');
	$('#custom-shapelayer-label-font-color')[0].color.fromString('#FFFFFF');
	$('#custom-shapelayer-label-bg-color')[0].color.fromString('#000000');
	$('#custom-shapelayer-label-bg-opacity').val('0.3');

	$( "#CustomShapePopup #tabs" ).tabs({
      disabled: []
    });
    $( "#CustomShapePopup #tabs" ).tabs( "option", "active", 0 );
    $('#CustomShapePopup .maPopupLoading').addClass('hidden');
}

function syncTerritorySelectOptions() {
    var $currentSelectionWrap = $('#shapeBuilderAvailableShapesColumn');
    var selectData = $('#shapeBuilderAvailableShapesColumn').data() || {};
    var previousOptions = selectData.options || [];
}

function cancelTerritoryCreation() {
    clearGeometryInfo();
    closeManualShapeDraw();
    closeShapeLayerBuilder();
    showMapElements();
    enablePlottedShapeClickEvents();
    removeLassoSearchMarkers();
    try {mapContextEnabled = true;}catch(e){}
}

function clearGeometryInfo()
{
    var $cleanUpMessage = MAToastMessages.showLoading({message:'Removing Territory Info...',timeOut:0,extendedTimeOut:0});
    //stop plotting any shapes
    try {
	    MALassoShapes.asyncProccess.tasks = [];
    }
    catch(e){}
    $('#shapeBuilderButtonDefaultPointer').click();
	selectedGeometry = {};
	MALassoShapes.selectedShapeMap = {};
	$('#shapeBuilderAvailableFilterCue').hide();
	$('#CreateTerritoryPopup .territory-name').removeClass('error');
	$('#shapeBuilderSelectedShapesColumn .slds-select').removeClass('error');
	$('a[href="#tab-geometry"]').click();
	$('#shapeLayerBuilderInputIWantToSee').val('defaultoption').change();
	var $popup = $('#CreateTerritoryPopup').removeData();
	$popup.find('.territory-name').val('');
	$popup.find('.territory-description').val('');
	$popup.find('.systeminfo').text('');
	$popup.find('.search-input').val('').blur();
	$popup.find('.search-table-watermark').show();
	$popup.find('.fillcolor')[0].color.fromString('#3083d3');
    $popup.find('.bordercolor')[0].color.fromString('#16325C');
    $popup.find('.fillopacity').val('0.2');
    $popup.find('.calculate-territory-aggregates').prop('checked', false);
	$('.search-table-wrapper .boundary-row, .search-table-selection .boundary-row').remove();
	$popup.find('.autocomplete-selection').remove();
	$popup.find('.search-type').first().click();
    $('#shapeBuilderDetailsName').val('');
    $('#input-id-02').val('');
    $('#filterItemList').empty();
	$('#shapeBuilderSelectedShapesColumn .slds-select').empty();
	$('#shapeBuilderAvailableShapesColumn .slds-select').empty();
	$('#shapeBuilderPasteClipboardTextArea').val('');
	$('#shapelayer-label-enabled').prop('checked', false);
	$('#shapelayer-label-override').val('');
	$('#shapelayer-label-justification').val('center');
	$('#shapelayer-label-font-size').val('10px');
	$('#shapelayer-label-font-color')[0].color.fromString('#FFFFFF');
	$('#shapelayer-label-bg-color')[0].color.fromString('#000000');
	$('#shapelayer-label-bg-opacity').val('0.3');
    $('#shapeBuilderDrawingSelectionList').empty();
    $('#shapeBuilderAddFilterButtonTooltip').show();
    var boundaries = getProperty(MALassoShapes,'boundries',false) || {};
    for(k in boundaries){
        var shape = MALassoShapes.boundries[k];
        if(shape != undefined) {
            MALassoShapes.boundries[k].setMap(null);
        }
    }
	MALassoShapes.boundries = {};

	//going to add a timeout here to check if any shapes may have been left on the map after canceling

	var cleanUpInt = setInterval(function() {
	    var currentRequests = 0;
	    try {
	        currentRequests = MALassoShapes.asyncProccess.running();
	    }
	    catch(e) {}
	    if(currentRequests == 0) {
	        clearInterval(cleanUpInt);
    	    var boundaries = getProperty(MALassoShapes,'boundries',false) || {};
    	    for(k in boundaries){
        	    MALassoShapes.boundries[k].setMap(null);
        	}
        	MALassoShapes.boundries = {};
        	MAToastMessages.hideMessage($cleanUpMessage);
	    }
	}, 500);

	//remove any tiles left on the map
	try {
        MA.Map.removeOverlay('maLassoShape');
    }catch(e){}
}

// shape builder ui v2 derek

function openShapeLayerBuilder() {
    $('#shapeBuilderDetailsName').val('');
    $('#input-id-02').val('');
    $('#filterItemList').empty();
    $('#shapeBuilderModalPositioner').addClass('in');
    $('#shapeBuilderBackdropPositioner').addClass('in');
    MAShapeSelector.populateCountryDropDown();
    $('#CreateTerritoryPopup .affect-visibility').attr('checked',false);

    setTimeout(function() {
        $('#CreateTerritoryPopup').addClass('slds-fade-in-open');
        $('#CreateTerritoryPopupBackdrop').addClass('slds-modal-backdrop--open');
        $('#shapeBuilderNavDetails').click();
        $('#shapeBuilderDetailsName').focus();
    }, 1);
}

function closeShapeLayerBuilder() {
    $('#CreateTerritoryPopup').removeClass('slds-fade-in-open');
    $('#CreateTerritoryPopupBackdrop').removeClass('slds-modal-backdrop--open');
    $('#shapeBuilderDrawingPanelPositioner').removeClass('overflow-visible');
    $('#shapeBuilderDrawingPanelPositioner').removeClass('in');
    $('#shapeBuilderDetailsName').val('');
    $('#input-id-02').val('');
    $('#shapeBuilderPasteClipboardPopover').hide();
    $('#shapeBuilderPasteClipboardTextArea').val('');
    $('#mapdiv').removeClass('map-lasso-mode');
    //$('#CreateTerritoryPopup .affect-visibility').attr('checked',false);
    //$('#filterItemList').empty();
    setTimeout(function() {
        $('#shapeBuilderModalPositioner').removeClass('in');
        $('#shapeBuilderBackdropPositioner').removeClass('in');
    }, 410);
}

function shapeLayerBuilderDetailsCompletionCheck() {
    if($('#shapeBuilderDetailsName').val().length > 80) {
        $('#shapeBuilderDetailsName').addClass('error');
        $('#shapeLayerBuilderTabDetailsNextButton, #shape-save-close, #shape-save-plot').attr('disabled', true);
        MAToastMessages.showWarning({
            message: MASystem.Labels.MA_Validation_Error,
            subMessage: MASystem.Labels.MA_Max_Length_80_Name,
            timeOut: 8000,
            closeButton: true
        });
        return;

    } else if($('#shapeBuilderDetailsName').val() === '') {
        $('#shapeBuilderDetailsName').addClass('error');
        $('#shapeLayerBuilderTabDetailsNextButton, #shape-save-close, #shape-save-plot').attr('disabled', true);
        MAToastMessages.showWarning({
            message: MASystem.Labels.MA_Validation_Error,
            subMessage: MASystem.Labels.MA_A_NAME_IS_REQUIRED_TO_CONTINUE,
            timeOut: 8000,
            closeButton: true
        });
        return;

    } else {
        $('#shapeLayerBuilderTabDetailsNextButton, #shape-save-close, #shape-save-plot').attr('disabled', false);
        $('#shapeBuilderDetailsName').removeClass('error');
        // $('#shapeBuilderNavShapeSelection').attr('target-content','shapeLayerBuilderTabShapeSelection')
        // $('#shapeBuilderNavShapeSelection, #shapeBuilderNavDisplay').removeClass('disabled').attr('disabled',false);

    }
}


function hideMapElements() {
    $('#horizontalViewsWrap .layersPanel').removeClass('is-in');
    $('#maMainNavbar').hide();
    $('#search-wrapper').hide();
    MA.map.disableKeyDragZoom();
}

function showMapElements() {
    $('#horizontalViewsWrap .layersPanel').addClass('is-in');
    $('#maMainNavbar').show();
    $('#search-wrapper').show();
    MA.map.enableKeyDragZoom();
}

function disablePlottedShapeClickEvents () {
    //this is need to allow lasso to move through shapes
    var $layers = $('#PlottedQueriesTable .PlottedShapeLayer');
    $.each($layers,function(i,layer) {
        var $layer = $(layer);
        var layerData = $layer.data();
        if($layer.hasClass('maTerritory')) {
            try {
                var shapeInfo = layerData.dataLayer;
                var style = shapeInfo.getStyle();
                style.clickable = false;
                shapeInfo.setStyle(style);
            }catch(e){}
        }
        else {
            //custom shape
            var shapes = layerData.proxObjects;
            $.each(shapes || [],function(i,shape) {
                shape.setOptions({clickable:false});
            });
        }
    });

    var $shapes = $('#PlottedQueriesTable .proximity.layer');
    $.each($shapes,function(i,shape) {
        var shapeData = $(shape).data();
        var proxObj = shapeData.proxObject;
        try {
            proxObj.setOptions({clickable:false});
        }
        catch(e){}
    });
}

function enablePlottedShapeClickEvents () {
    //this is need to allow lasso to move through shapes
    var $layers = $('.PlottedShapeLayer');
    $.each($layers,function(i,layer) {
        var $layer = $(layer);
        var layerData = $layer.data();
        if($layer.hasClass('maTerritory')) {
            try {
                var shapeInfo = layerData.dataLayer;
                var style = shapeInfo.getStyle();
                style.clickable = true;
                shapeInfo.setStyle(style);
            }catch(e){}
        }
        else {
            //custom shape
            var shapes = layerData.proxObjects;
            $.each(shapes || [],function(i,shape) {
                shape.setOptions({clickable:true});
            });
        }
    });

    var $shapes = $('#PlottedQueriesTable .proximity.layer');
    $.each($shapes,function(i,shape) {
        var shapeData = $(shape).data();
        var proxObj = shapeData.proxObject;
        try {
            proxObj.setOptions({clickable:true});
        }
        catch(e){}
    });
}

function drawShapeBuilderMapTiles(labels) {
    
    try {
        MA.Map.removeOverlay('maLassoShape');
    }catch(e){}
    var MAIO_URL = getProperty(MASystem, 'Organization.MAIO_URL', false) || 'https://api.mapanything.io';
    var customTileURL = MAIO_URL + '/services/boundary/tile';
    var overLay = $('#shapeLayerBuilderInputCountry').val();
    var level = $('#shapeLayerBuilderInputIWantToSee').val();
    labels = labels || false;
    // set up the tile server 
    // displaying labels with zoom > 9 looks rediculous, disabling 
    var CensusLayer = new google.maps.ImageMapType({
        name: 'maLassoShape',
        maxZoom: 18,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.75,
        getTileUrl: function(coord, zoom) {
            var zoomCheck = labels;
            if(zoom < 9 && labels){
                zoomCheck = false;
            }
            else if (zoom >= 10 && labels) {
                zoomCheck = true;
            }
            return [ customTileURL, '/1?', 'x=' + coord.x, '&', 'y=' + coord.y, '&', 'z=' + zoom, '&', 'overlay=' + overLay, '&', 'level=' + level, '&', 'labels=' + zoomCheck].join('');
        }
    });

    MA.map.overlayMapTypes.push(CensusLayer);
}

//The return here is for the use of the drawShapeBuilderMapTiles in the calling function. If false it will not display the label tiles.
function showHideLabelOptions() {
    // show or hide the labels options based on selection
    // currently on USA zips work
    var labelsAvailable = ['USA-4'];
    var countrySelect = $('#shapeLayerBuilderInputCountry').val();
    var levelSelect = $('#shapeLayerBuilderInputIWantToSee').val();
    var currentSelection = countrySelect + '-' + levelSelect;
    var $labelSelect = $('#js-shape-label-wrapper').hide();
    // check if selection is in array
    var showLabels = false;
    for(var s = 0; s < labelsAvailable.length; s++) {
        var level = labelsAvailable[s];
        if(level === currentSelection) {
            showLabels = true;
            break;
        }
    }
    if (showLabels) {
        $labelSelect.show();
        //if the user is still using a valid option to display the labels input and they previously selected to show labels then lets continue to display them.
        if($('#shapeLayerBuilderShowTileLabels').attr('checked')){            
            return true;
        }else {
            return false;
        }

    } else {
        return false;
    }
}

function removeLassoSearchMarkers() {
    var lassoMarkers = getProperty(MA, 'Map.lassoMarkers', false) || [];
    for (var m = 0; m < lassoMarkers.length; m++) {
        var lassoMarker = lassoMarkers[m];
        lassoMarker.setMap(null);
    }

    lassoMarkers = [];
}

function showShapeBuilderDrawingMode() {
    var mainPopupName = $('#shapeBuilderDetailsName').val();
    var mainPopupDescription =$('#input-id-02').val();

    var showLabelsOnLoad = showHideLabelOptions();
    closeShapeLayerBuilder();
    disablePlottedShapeClickEvents();
    hideMapElements();
    try {mapContextEnabled = false;}catch(e){}
    $('#shapeBuilderDrawingToolsPositioner').addClass('in');
    $('#shapeBuilderDrawingPanelPositioner').addClass('in');
    $('#shapeBuilderDrawingModePanelWrap').show();
    $('#shapeBuilderDrawingSelectionListSpinner').show();
    $('.noSidebarCell').addClass('shape-builder-cursor-build-mode');
    $('#mapdiv').addClass('map-lasso-mode');

    $('#shapeBuilderDetailsNameDrawingMode').val(mainPopupName).data('description',mainPopupDescription);

    drawShapeBuilderMapTiles(showLabelsOnLoad);

    //proccess our html off the main thread
    processTerritoryHTML('sidebar').then(function(res) {
        var html = res.htmlString;
        $('#shapeBuilderDrawingSelectionList').html(html);
        shapeBuilderDrawingSelectionCountUpdate();
        var shapesToPlot = res.geoids;
        MALassoShapes.populateLassoListItems(shapesToPlot);
    });


    $('#shapeBuilderButtonDefaultPointer').on('click',function(){
        // reset cursor
        MA.map.setOptions({ draggableCursor : "url("+MASystem.Images.cursors.hand+"), auto" });
        google.maps.event.clearListeners(MA.map.getDiv(), 'mousedown');
        MALassoShapes.enable();

        //remove toggle listeners
        MALassoShapes.clearPolylineAndListeners();
    });

    //$('#shapeBuilderButtonLassoPlus').click();
    //changing to start in map move mode
    $('#shapeBuilderButtonDefaultPointer').click();

    // shapeBuilderCheckSelectedBoundariesDrawing();
    $('#shapeBuilderDrawingModeTools').show();


    setTimeout(function() {
        $('#shapeBuilderDrawingModePanelWrap').addClass('in');
        $('#shapeBuilderDrawingModeTools').addClass('in');
    }, 001);
    setTimeout(function() {
        $('#shapeBuilderDrawingPanelPositioner').addClass('overflow-visible');
        $('#shapeBuilderDrawingToolsPositioner').addClass('overflow-visible');
    }, 401);
    setTimeout(function() {
        $('#shapeBuilderDrawingSelectionListSpinner').hide();
    }, 1500);

    // push refresh layers button to the side of the lasso tools panel
    $('.refreshMarkersInThisAreaWrap').addClass('refreshLassoIsVisible');

    // hide Search POI list right side bar
    window.VueEventBus.$emit('hide-side-bar');
}

function processTerritoryHTML(htmlLocation,shapesToProcess) {
    var dfd = $.Deferred();
    htmlLocation = htmlLocation == undefined ? 'sidebar' : htmlLocation;
    var currentSelections = shapesToProcess || MALassoShapes.selectedShapeMap;
    var dataLevel = $('#shapeLayerBuilderInputIWantToSee').val();
    //proccess our html off the main thread
    if(window.Worker) {
        var processData = {
            cmd : 'processTerritoryShapeHTML',
            ShapeSelectionsObject : JSON.stringify(currentSelections),
            selectLocation : htmlLocation,
            dataLevel : dataLevel,
            externalScripts : JSON.stringify([MA.resources.MAShapeProcess])
        };

        var htmlWorker = new Worker(MA.resources.MAWorker);
        htmlWorker.postMessage(processData);
        htmlWorker.onmessage = function(e) {
            var data = e.data;
            if(data && data.success) {
                dfd.resolve(data.data);
            }
            else {
                dfd.resolve('');
            }
        };
    }
    else {
        processTerritoryShapeHTML({ShapeSelectionsObject:currentSelections,selectLocation:htmlLocation,dataLevel : dataLevel},function (res) {
            if(res) {
                dfd.resolve(res);
            }
            else {
                dfd.resolve('');
            }
        })
    }

    return dfd.promise();
}

function showShapeBuilderManualMode() {
    //removing this line, clears out previous data
    //openShapeLayerBuilder();
    // return cursor
    MA.map.setOptions({ draggableCursor : "url("+MASystem.Images.cursors.hand+"), auto" });

    //we need to transfer our drawn shape that are check back into our shape builder
    MALassoShapes.transferSelectedAndSave();
    enablePlottedShapeClickEvents();
    showMapElements();
    removeLassoSearchMarkers();
    try {mapContextEnabled = true;}catch(e){}
    $('#shapeBuilderModalPositioner').addClass('in');
    $('#shapeBuilderBackdropPositioner').addClass('in');
    setTimeout(function() {
        $('#CreateTerritoryPopup').addClass('slds-fade-in-open');
        $('#CreateTerritoryPopupBackdrop').addClass('slds-modal-backdrop--open');
    }, 001);


    $('#shapeBuilderDrawingModePanelWrap').removeClass('in');
    $('.noSidebarCell').removeClass('shape-builder-drawing-tool--lasso-plus shape-builder-drawing-tool--lasso-minus shape-builder-drawing-tool--lasso-toggle');
    $('#shapeBuilderDrawingModeTools').removeClass('in');
    $('#shapeBuilderDrawingPanelPositioner').removeClass('overflow-visible');
    $('#shapeBuilderDrawingToolsPositioner').removeClass('overflow-visible');
    setTimeout(function() {
        $('#shapeBuilderDrawingModePanelWrap').hide();
        $('#shapeBuilderDrawingModeTools').hide();
        $('#shapeBuilderDrawingToolsPositioner').removeClass('in');
    }, 350);
}

function closeManualShapeDraw(){
     $('#shapeBuilderDrawingModePanelWrap').removeClass('in');
    $('.noSidebarCell').removeClass('shape-builder-drawing-tool--lasso-plus shape-builder-drawing-tool--lasso-minus shape-builder-drawing-tool--lasso-toggle');
    $('#shapeBuilderDrawingModeTools').removeClass('in');
    $('#shapeBuilderDrawingPanelPositioner').removeClass('overflow-visible');
    $('#shapeBuilderDrawingToolsPositioner').removeClass('overflow-visible');
    setTimeout(function() {
        $('#shapeBuilderDrawingModePanelWrap').hide();
        $('#shapeBuilderDrawingModeTools').hide();
        $('#shapeBuilderDrawingToolsPositioner').removeClass('in');
    }, 350);
    $('#mapdiv').removeClass('map-lasso-mode');

    // resume the original position of refresh layers button on the right side end of map
    $('.refreshMarkersInThisAreaWrap').removeClass('refreshLassoIsVisible');

    try{
        google.maps.event.trigger(MA.map,'resize')
    }catch(e){}
}

function showShapeBuilderDrawingPointerOverride() {
    $('.noSidebarCell').addClass('shape-builder-drawing-tool--pointer-override');
    $('.shape-builder-drawing-tool-button').removeClass('slds-is-active');
    $('#shapeBuilderButtonDefaultPointer').addClass('slds-is-active');
}

function hideShapeBuilderDrawingPointerOverride() {
    $('.noSidebarCell').removeClass('shape-builder-drawing-tool--pointer-override');
    $('.shape-builder-drawing-tool-button').removeClass('slds-is-active');
}

function shapeBuilderDrawingSelectionCountUpdate() {
    var count = $('#shapeBuilderDrawingSelectionList .slds-listbox__item.slds-is-selected').length;
    $('#shapeBuilderDrawingSelectionCount').html(count);
}

/**This function is meant to select all the options in a specific select list.
 * param: element that contains the select list such as #container or .container
 */
function selectAllOptions(elem) {
    $(elem).find('select option').prop('selected', 'selected');
}

/**This function is meant to de-select all the options in a specific select list.
 * param: element that contains the select list such as #container or .container
 */
function deselectAllOptions(elem) {
    $(elem).find('select option').removeAttr('selected');

}

/**
 * This function removes all selected shapes from 'Selected Shapes' list 
 * and puts them back in the 'Available Shapes' list
 */
function clearSelectedShapes() {
    var $selectedOptions = $('#shapeBuilderSelectedShapesColumn .slds-select option:selected');
    //$('#shapeBuilderAvailableShapesColumn .slds-select').append($selectedOptions);
    $('#shapeBuilderSelectedShapesColumn .slds-select option:selected').remove();
    var $availableOptions = $('#shapeBuilderAvailableShapesColumn .slds-select option');
    var currentDataLevel = $('#shapeLayerBuilderInputIWantToSee').val();

    //remove from plotted shapes
    var selectionLength = $selectedOptions.length;
    var count = 0;
    var newSelectHTML = '';
    setTimeout(function doBatch() {
        if(count < selectionLength) {
            var recordsProcessed = 0;
            while (recordsProcessed < 100 && count < selectionLength) {
                recordsProcessed++;
                var selection = $selectedOptions[count];
                var shapeText = selection.text;
                var shapeValue = selection.value;
                var shapeLevel = selection.getAttribute('data-level');
                //if this matches the current selection to display, add it to the list
                if(shapeLevel == currentDataLevel)
                {
                    //also make sure we are not adding duplicates
                    var foundMatch = false;
                    $.each($availableOptions,function(i,opt) {
                        var value = opt.value;
                        if(value == shapeValue) {
                            foundMatch = true;
                            return false;
                        }
                    });
                    if(!foundMatch) {
                        newSelectHTML += selection.outerHTML;
                    }
                }

                var shape = MALassoShapes.boundries[shapeValue];
                var shapeInfo = MALassoShapes.selectedShapeMap[shapeValue];
                if(shapeInfo != undefined) {
                    MALassoShapes.selectedShapeMap[shapeValue] = undefined;
                }

                if(shape != undefined) {
                    shape.setMap(null);
                    MALassoShapes.boundries[shapeValue] = undefined;
                }
                count += 1;
            }

            setTimeout(doBatch, 1);
        }
        else {
            //done add options
            if(newSelectHTML != '') {
                $('#shapeBuilderAvailableFilterCue').hide();
            }
            $('#shapeBuilderAvailableShapesColumn .slds-select').append(newSelectHTML);
        }
    },1);
}

/**
 * This function adds selected shapes from 'Available Shapes' list to
 * the 'Selected Shapes' list
 */
function addSelectedShapes() {
    $('#shapeBuilderSelectedShapesColumn .slds-select').removeClass('error');
    var $selectedOptions = $('#shapeBuilderAvailableShapesColumn .slds-select option:selected');
    var $availableOptions = $('#shapeBuilderSelectedShapesColumn .slds-select option');
    //$('#shapeBuilderSelectedShapesColumn .slds-select').append($selectedOptions);
    $('#shapeBuilderAvailableShapesColumn .slds-select option:selected').remove();
    var dataLevel = $('#shapeLayerBuilderInputIWantToSee').val();

    var selectionLength = $selectedOptions.length;
    var count = 0;
    var newSelectHTML = '';
    setTimeout(function doBatch() {
        if(count < selectionLength) {
            var recordsProcessed = 0;
            while (recordsProcessed < 100 && count < selectionLength) {
                recordsProcessed++;
                var selection = $selectedOptions[count];
                var shapeText = selection.text;
                var shapeValue = selection.value;
                if(MALassoShapes.selectedShapeMap[shapeValue] == undefined) {
                    MALassoShapes.selectedShapeMap[shapeValue] = {'label':shapeText,'value':shapeValue,'isPlotted':false,'level':dataLevel,'isActive':true};
                }
                else {
                    MALassoShapes.selectedShapeMap[shapeValue].isActive = true;
                }
                //also make sure we are not adding duplicates
                var foundMatch = false;
                $.each($availableOptions,function(i,opt) {
                    var value = opt.value;
                    if(value == shapeValue) {
                        foundMatch = true;
                        return false;
                    }
                });
                if(!foundMatch) {
                    newSelectHTML += selection.outerHTML;
                }

                count += 1;
            }

            setTimeout(doBatch, 1);
        }

        else {
            $('#shapeBuilderSelectedShapesColumn .slds-select').append(newSelectHTML);
        }
    },1);
}

var IEFirstShowFix = true;
function showShapeBuilderFilterItem1() {

    var $shapeFilterForm = $('#shapeLayerEditorTemplates .js-shape-filter-wrapper').clone().removeClass('shape-filter-template');
    var filterIndex = 'js-filter-'+MA.componentIndex++;
    var classToAdd = 'active ' + filterIndex;
    var $filterListItem = $('#filter-items-list-template .filter-list-item').clone().addClass(classToAdd);
    var $filterWrapper = $('#filterExample1').addClass(filterIndex);
    var $container = $('#filterExample1 .filter-form-container').empty();
    $shapeFilterForm.find('.filter-item-pills').empty();
    $container.append($shapeFilterForm).show();
    $('#shapeBuilderAddFilterButtonTooltip').hide();
    $('#filterItemList').append($filterListItem);
    $filterListItem.show();
    $filterListItem.on('click', function() {
        var $filter = $(this);
        var offset = $filterListItem.offset();

        var filterWidth = $filter.width();
        var leftOffset = offset.left;
        var pixelsFromSideOfPage = filterWidth + leftOffset + 20; //adding 20 for some padding

        var criteriaHeight = $filterWrapper.outerHeight();
        var itemHeight = $filterWrapper.outerHeight();
        var bottom = offset.top + itemHeight - criteriaHeight;
        var offsetWidth = $filterWrapper.outerWidth();
        $filterWrapper.css({
            'display': 'block'
        }).offset({
            top: bottom-250,//250 is lazy... I didn't do any math to check this, adding 'pills' does not line up anymore
            left: pixelsFromSideOfPage
        });
        $filterWrapper.data('activeFilter',$filter);


        //try to popuplate previous data
        var filterInfo = $filter.data() || {};

        var filterData = filterInfo.filterData;
        if(filterData != undefined) {
            $filterWrapper.find('.field-select').val(filterData.field_id);
            $filterWrapper.find('.operator-select').val(filterData.operator);
            var pills = filterData.values || [];
            var pillHTML = '';
            $.each(pills,function(i,pill) {
                pillHTML += '<span class="filter-pill slds-pill slds-pill_link"><a href="javascript:void(0);" class="slds-pill__action" title="'+pill+'"><span class="slds-pill__label filter-pill-value">'+pill+'</span></a><button class="slds-button slds-button_icon slds-button_icon slds-pill__remove js-remove-pill" title="Remove"><div class="slds-button__icon ma-icon ma-icon-remove remove-filter-pill"></div></button></span>';
            });
            $filterWrapper.find('.filter-item-pills').html(pillHTML);
        }
        else {
            //clear it out
            $filterWrapper.find('.field-select').val($filterWrapper.find('.field-select option:first').val());
            $filterWrapper.find('.operator-select').val($filterWrapper.find('.operator-select option:first').val());
            $filterWrapper.find('#filterItemValueInput').val('');
            $filterWrapper.find('.filter-item-pills').html('');
        }
    });
 
    if (IEFirstShowFix) {
        IEFirstShowFix = false;
        $filterListItem.click();
        // hide then reshow... yes this is a hack (MAP-6536)
        $('#filterExample1 .js-slds-filters__item-popover-cancel-button').click();
        $filterListItem.click();
    } else {
        $filterListItem.click();
    }
    

    $('#shapeBuilderFiltersWrap,#filterExample1, #shapeBuilderFiltersFooterRemoveButton').show();
    // add click event listener to cancel button. Canceling the popup also will remove filter list item 
    $('#filterExample1').on('click','.js-slds-filters__item-popover-cancel-button', function() {
        if ($('#filterExample1').is(':visible')) {
            removeFilterListItem($(this).closest('#filterExample1').siblings().find('.active .js-remove-filter-item'));
        }
    });

    MAShapeSelector.populateFilterForm().then(function(res){

        if(res.success){

        }
        else {
            //maybe hide the filter?
        }
    });
    showHideAddFilterButton();
}

function shapeBuilderCheckFilters() {
    //remove any previous filters
    $('#filterItemList').empty();
    //remove popup filter
    $('#filterExample1').hide();
    //empty the select list, may want to leave previous selections?
    $('#shapeBuilderAvailableShapesColumn select').empty()


    if ( $('#shapeLayerBuilderInputIWantToSee').val() == 'defaultoption' ) {
        $('#shapeBuilderFiltersDrawOnMapWrap').hide();
        $('#shapeBuilderFiltersWrap').hide();
        $('#shapeLayerBuilderTabShapeSelection .js-lasso-wrapper').hide();
        //set delay to prevent issues with display show/hide
        setTimeout(function(){
            $('#shapeBuilderIWantToSeeTooltip').addClass('in');
            // setTimeout(function(){
            //     $('#shapeBuilderIWantToSeeTooltip').removeClass('in');
            // }, 5000);
        }, 150);
        $('#shapeLayerBuilderInputIWantToSee').hover(
              function() {
                $('#shapeBuilderIWantToSeeTooltip').addClass('in');
              }, function() {
                $('#shapeBuilderIWantToSeeTooltip').removeClass('in');
              }
            );
    } else {
        $('#shapeLayerBuilderTabShapeSelection .js-lasso-wrapper').show();
        $('#shapeBuilderFiltersWrap').show();
        showHideAddFilterButton();
        $('#shapeBuilderFiltersDrawOnMapWrap').show();
        $('#shapeBuilderIWantToSeeTooltip').removeClass('in');
    }
}

function openShapeLayerBuilderDraw() {
    MA.Map.removeOverlay('customTileLayer');
    $('#shapeBuilderDrawingModePanelWrap').addClass('in');
    $('#shapeBuilderDrawingModeTools').addClass('in');
    $('#shapeBuilderButtonLassoPlus').click();
    $('#shapeBuilderDrawingSelectionListSpinner').show();
    setTimeout(function() {
        $('#shapeBuilderDrawingSelectionListSpinner').hide();
    }, 1500);
}

function hideSLDSFilterCriteria() {
    $('#filterExample1').offset({
        left: 0,
        top: 0
    }).css({
        'display': 'none'
    });
}

function showShapeBuilderPasteClipboardErrors() {
    $('#shapeBuilderPasteClipboardBase').hide();
    $('#shapeBuilderPasteClipboardErrorWrap').show();
}

function checkForSelectedShapes()
{
    var selectedShapeOptions = $('#shapeBuilderSelectedShapesColumn .slds-select option');
    if(selectedShapeOptions.size() > 0)
    {
        $('.save-boundary').attr('disabled', false);


    } else {
        $('.save-boundary').attr('disabled', true);
    }
}

// listeners
$(document).ready(function() {


    $('#shapeBuilderDetailsName').on('change',function(){
        var thisVal = $('#shapeBuilderDetailsName').val();
        $('#shapeBuilderDetailsNameDrawingMode').val(thisVal);
    });
    $('#shapeBuilderDetailsNameDrawingMode').on('change',function(){
        var thisVal = $('#shapeBuilderDetailsNameDrawingMode').val();
        $('#shapeBuilderDetailsName').val(thisVal);
    });

    $('#filterItemList .active .filter-item').on('click', function() {
        var offset = $(this).offset();
        var criteriaHeight = $('#filterExample1').outerHeight();
        var itemHeight = $(this).outerHeight();
        var bottom = offset.top + itemHeight - criteriaHeight;
        var offsetWidth = $(this).outerWidth();
        $('#filterExample1').css({
            'display': 'block'
        }).offset({
            top: bottom,
            left: offset.left + offsetWidth + 16
        });
        // showSLDSFilterCriteria(offset);
    });

    $('.js-show-shape-builder-drawing-mode').on('click', function() {
        showShapeBuilderDrawingMode();
    });

    $('.js-show-shape-builder-manual-mode').on('click', function() {
        var mainPopupDescription = $('#shapeBuilderDetailsNameDrawingMode').data('description');
        $('#input-id-02').val(mainPopupDescription);
        showShapeBuilderManualMode();

    });

    $('.js-show-shape-builder-paste-clipboard').on('click', function() {
        $('#shapeBuilderPasteClipboardPopover').show();
        $('#shapeBuilderPasteClipboardBase').show();
        $('#shapeBuilderPasteClipboardTextArea').focus();
        $('#shapeBuilderPasteClipboardErrorWrap').hide();
        

    });

    $('.js-hide-shape-builder-paste-clipboard').on('click', function() {
        $('#shapeBuilderPasteClipboardPopover').hide();
        $('#shapeBuilderPasteClipboardTextArea').val('');
    });

    $('.js-show-shape-builder-paste-clipboard-guidelines').on('click', function() {
        $('#shapeBuilderPasteClipboardStart').hide();
        $('#shapeBuilderPasteClipboardGuidelines').show();
        $('#shapeBuilderPasteClipboardCloseX').hide();
    });

    $('.js-hide-shape-builder-paste-clipboard-guidelines').on('click', function() {
        $('#shapeBuilderPasteClipboardStart').show();
        $('#shapeBuilderPasteClipboardGuidelines').hide();
        $('#shapeBuilderPasteClipboardTextArea').focus();
        $('#shapeBuilderPasteClipboardCloseX').show();
    });

    $('.js-show-shape-builder-paste-clipboard-processing').on('click', function() {
        $('#shapeBuilderPasteClipboardProcessingWrap').show();
        $('#shapeBuilderPasteClipboardTextAreaWrap').hide();
        $('#shapeBuilderPasteClipboardProcessingButton').addClass('disabled');
        $('#shapeBuilderPasteClipboardCancelButton').addClass('disabled');

        MACopyAndPasteZipCodes.getUserEntry();

    });

    $('.js-hide-shape-builder-paste-clipboard-processing').on('click', function() {
        $('#shapeBuilderPasteClipboardProcessingWrap').hide();
        $('#shapeBuilderPasteClipboardTextAreaWrap').show();
        // $('#shapeBuilderPasteClipboardProcessingButton').removeClass('disabled');
        // $('#shapeBuilderPasteClipboardCancelButton').removeClass('disabled');
    });

    $('.shape-builder-drawing-tool-button').on('click', function() {
        $('#shapeBuilderPasteClipboardProcessingWrap').hide();
        $('#shapeBuilderPasteClipboardTextAreaWrap').show();
        // $('#shapeBuilderPasteClipboardProcessingButton').removeClass('disabled');
        // $('#shapeBuilderPasteClipboardCancelButton').removeClass('disabled');
    });

    //next
    $('#shapeLayerBuilderTabDetailsNextButton').on('click', function() {

        if ($('#shapeBuilderDetailsName').val() == '') {

            //insert error message that a name needs to be entered before continuing
        }else {

            $(this).closest('.slds-modal__content').find('.slds-nav-vertical__item').removeClass('slds-is-active');
            $('#shapeBuilderNavShapeSelection').closest('.slds-nav-vertical__item').addClass('slds-is-active');
            $('#shapeLayerBuilderTabDetails').removeClass('slds-show').addClass('slds-hide');
            $('#shapeLayerBuilderTabShapeSelection').removeClass('slds-hide').addClass('slds-show');
            shapeBuilderCheckFilters();
            //MAShapeSelector.populateCountryDropDown();
        }
    });

    $('#shapeBuilderDrawingSelectionList .slds-listbox__item').on('click', function() {
        $(this).toggleClass('slds-is-selected');
        shapeBuilderDrawingSelectionCountUpdate();
        // shapeBuilderCheckSelectedBoundariesDrawing();
    });

    $('#shapeBuilderDrawingSelectionSelectAll').on('click', function() {
        $('#shapeBuilderDrawingSelectionList .slds-listbox__item').addClass('slds-is-selected');

        if(typeof(MALassoShapes.boundries) != 'object') {
            MALassoShapes.boundries = {};
        }
        if(typeof(MALassoShapes.selectedShapeMap) != 'object') {
            MALassoShapes.selectedShapeMap = {};
        }
        var keys = Object.keys(MALassoShapes.selectedShapeMap) || [];
        var length = keys.length;
        var c = 0;
        setTimeout(function doBatch() {
            if(c < length) {
                var recordsProcessed = 0;
                while (recordsProcessed < 50 && c < length) {
                    recordsProcessed++;
                    var prop = keys[c];
                    var shapeInfo = MALassoShapes.selectedShapeMap[prop];
                    if(shapeInfo != undefined) {
                        MALassoShapes.selectedShapeMap[prop].isActive = true;
                        MALassoShapes.selectedShapeMap[prop].isPlotted = true;
                    }

                    if(MALassoShapes.boundries[prop] != undefined) {
                        MALassoShapes.boundries[prop].setMap(MA.map);
                    }

                    c += 1;
                }

                setTimeout(doBatch, 1);
            }
            else {
                //done add options
                shapeBuilderDrawingSelectionCountUpdate();
            }
        },1);
    });

    $('#shapeBuilderDrawingSelectionSelectNone').on('click', function() {
        //$('#shapeBuilderDrawingSelectionList .slds-listbox__item').click();
        $('#shapeBuilderDrawingSelectionList .slds-listbox__item').removeClass('slds-is-selected');

        if(typeof(MALassoShapes.boundries) != 'object') {
            MALassoShapes.boundries = {};
        }
        if(typeof(MALassoShapes.selectedShapeMap) != 'object') {
            MALassoShapes.selectedShapeMap = {};
        }
        var keys = Object.keys(MALassoShapes.selectedShapeMap) || [];
        var length = keys.length;
        var c = 0;
        setTimeout(function doBatch() {
            if(c < length) {
                var recordsProcessed = 0;
                while (recordsProcessed < 50 && c < length) {
                    recordsProcessed++;
                    var prop = keys[c];

                    var shapeInfo = MALassoShapes.selectedShapeMap[prop];
                    if(shapeInfo != undefined) {
                        MALassoShapes.selectedShapeMap[prop].isActive = false;
                        MALassoShapes.selectedShapeMap[prop].isPlotted = false;
                    }

                    if(MALassoShapes.boundries[prop] != undefined) {
                        MALassoShapes.boundries[prop].setMap(null);
                    }
                    c += 1;
                }

                setTimeout(doBatch, 1);
            }
            else {
                //done add options
                shapeBuilderDrawingSelectionCountUpdate();
            }
        },1);
    });

    $('#shapeBuilderDrawingSaveAndNew').on('click', function() {
        //alert('Show Layer Saved Toast');
        MALassoShapes.transferSelectedAndSave(false).then(function(res){
            saveBoundary(false).then(function(res){
                if(res.success)
                {
                    //$selectedOptions.empty();
                    $('#shapeBuilderDrawingSelectionList').empty();
                    $('#shapeBuilderSelectedShapesColumn .slds-select').empty();
                    for(k in getProperty(MALassoShapes,'boundries',false)){
                	    MALassoShapes.boundries[k].setMap(null);
                	}
            	    MALassoShapes.boundries = {};
            	    //$ulList.empty();
                }

            });
        });

        $('#shapeBuilderDrawingSelectionList .slds-listbox__item').removeClass('slds-is-selected');
        shapeBuilderDrawingSelectionCountUpdate();
        $('#shapeBuilderDetailsNameDrawingMode').val('').focus();
        $('#shapeBuilderDrawingModeNameTooltip').addClass('in');
        $('#shapeBuilderButtonLassoPlus').click();
        $('#shapeBuilderDrawingSaveAndNew').addClass('disabled');
        $('#shapeBuilderDrawingSaveAndPlot').addClass('disabled');
    });
    $('#shapeBuilderDrawingSaveAndPlot').off('click');
    $('#shapeBuilderDrawingSaveAndPlot').on('click', function() {
        //alert('Show Layer Saved Toast');
        var $saving = MAToastMessages.showLoading({message:'Saving...',timeOut:0,extendedTimeOut:0});
        MALassoShapes.transferSelectedAndSave(true).then(function(res){
            saveBoundary(true).then(function(res){
                if(res.success)
                {
                    MAToastMessages.hideMessage($saving);
                    cancelTerritoryCreation();
                }

            });
        });
    });

    // cursor button type toggling
    $('.shape-builder-drawing-tool-button').on('click', function() {
        $('.shape-builder-drawing-tool-button').removeClass('slds-is-active');
        $(this).addClass('slds-is-active');
        $('.noSidebarCell').removeClass('shape-builder-drawing-tool--lasso-plus shape-builder-drawing-tool--lasso-minus shape-builder-drawing-tool--lasso-toggle');
        if ($(this).attr("id") == "shapeBuilderButtonLassoPlus") {
            $('.noSidebarCell').addClass('shape-builder-drawing-tool--lasso-plus');
            MA.map.setOptions({ draggableCursor : "url("+MASystem.Images.cursors.lasso_plus+"), auto" })
        } else if ($(this).attr("id") == "shapeBuilderButtonLassoMinus") {
            $('.noSidebarCell').addClass('shape-builder-drawing-tool--lasso-minus');
            MA.map.setOptions({ draggableCursor : "url("+MASystem.Images.cursors.lasso_minus+"), auto" })
        } else if ($(this).attr("id") == "shapeBuilderButtonLassoToggle") {
            $('.noSidebarCell').addClass('shape-builder-drawing-tool--lasso-toggle');
            MA.map.setOptions({ draggableCursor : "default" })
        }
    });

    $('#shapeBuilderDetailsName').on('keyup', function() {
        shapeLayerBuilderDetailsCompletionCheck();
    });

    $('#shapeBuilderDetailsNameDrawingMode').on('keyup', function(e) {
        e.stopPropagation();
        if ($(this).val() !== '') {
            $('#shapeBuilderDrawingModeNameTooltip').removeClass('in');
        } else {
            $('#shapeBuilderDrawingModeNameTooltip').addClass('in');
        }
    });

    //prevent drawing tool toggle when entering shape layer name
    $('#shapeBuilderDetailsNameDrawingMode').on('keydown', function(e) {
        e.stopPropagation();
    });

    //I want to see input change
    $('#shapeLayerBuilderInputIWantToSee').off('change');
    $('#shapeLayerBuilderInputIWantToSee').on('change', function ()
    {
        shapeBuilderCheckFilters();
        
        var wantToSeeVal = $('#shapeLayerBuilderInputIWantToSee').val();
        if (wantToSeeVal != '' && wantToSeeVal != 'defaultoption')
        {
            $('#shapeBuilderFiltersWrap').hide();
            $('#shapeBuilderAddFilterButtonTooltip').empty().hide();
            $('#shapeBuilderAddFilterButtonTooltip').append('<div class="slds-popover__body" style="hyphens: none;">Let’s filter down what ' + $('#shapeLayerBuilderInputIWantToSee option:selected').html() + ' you want to see.<br/><br/>e.g. I want to see ZIP Codes filtered by a specific <strong>County</strong>.</div>');

            //attempt to get a base of shapes without a filter, limited to 500
            var processFilterData = {
                subType: 'boundary',
                action: 'search',
                version: '1'
            };
    
            var postFilterBody = {
                "overlay": $('#shapeLayerBuilderInputCountry').val(),
                "level": $('#shapeLayerBuilderInputIWantToSee').val()
            };
            setTimeout(function() {$('#shapeBuilderAvailableShapesSpinner').show();}, 10);
            populateAvailableShapeOptions(processFilterData, postFilterBody, true).then(function (res)
            {
                $('#shapeBuilderFiltersWrap').show();
                showHideAddFilterButton();
                if(res && res.success) {
                    if(!res.foundShapes) {
                        //no shpaes returned, show how to add filter
                        $('#shapeBuilderAddFilterButtonTooltip').show();
                    }
                }
                else {
                    //no shpaes returned, show how to add filter
                    $('#shapeBuilderAddFilterButtonTooltip').show();
                }
                $('#shapeBuilderAvailableShapesSpinner').hide();
    
            });
        }
    
    });

    //prevent drawing tool toggle when entering shape layer name
    $('#shapeBuilderNavShapeSelection').on('click', function() {
        //shapeBuilderCheckFilters();
        if ($('#shapeBuilderDetailsName').val() == '') {
            //insert error message that a name needs to be entered before continuing
        }else {
            $(this).closest('.slds-modal__content').find('.slds-nav-vertical__item').removeClass('slds-is-active');
            $('#shapeBuilderNavShapeSelection').closest('.slds-nav-vertical__item').addClass('slds-is-active');
            $('#shapeLayerBuilderTabDetails').removeClass('slds-show').addClass('slds-hide');
            $('#shapeLayerBuilderTabShapeSelection').removeClass('slds-hide').addClass('slds-show');
            //shapeBuilderCheckFilters();
            //MAShapeSelector.populateCountryDropDown();
        }
        //MAShapeSelector.populateCountryDropDown();
    });

    //prevent drawing tool toggle when entering shape layer name
    $('#shapeBuilderFiltersFooterAddFilterButton').on('click', function() {
        showShapeBuilderFilterItem1();
    });

    // hide shape builder paste zipcode error wrap
    $('.js-hide-shape-builder-paste-error-wrap').on('click', function() {
      $('#shapeBuilderPasteClipboardErrorWrap, #shapeBuilderPasteClipboardProcessingWrap').hide();
      $('#shapeBuilderPasteClipboardBase, #shapeBuilderPasteClipboardTextAreaWrap').show();
    });
});
