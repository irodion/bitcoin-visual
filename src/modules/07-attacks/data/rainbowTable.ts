export interface RainbowEntry {
  password: string;
  sha256: string;
}

/** 50 common passwords with precomputed SHA-256 hashes. */
export const RAINBOW_TABLE: readonly RainbowEntry[] = [
  {
    password: "password",
    sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  },
  {
    password: "123456",
    sha256: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
  },
  {
    password: "qwerty",
    sha256: "65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5",
  },
  { password: "admin", sha256: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" },
  {
    password: "letmein",
    sha256: "1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032",
  },
  {
    password: "welcome",
    sha256: "280d44ab1e9f79b5cce2dd4f58f5fe91f0fbacdac9f7447dffc318ceb79f2d02",
  },
  {
    password: "monkey",
    sha256: "000c285457fc971f862a79b786476c78812c8897063c6fa9c045f579a3b2d63f",
  },
  {
    password: "dragon",
    sha256: "a9c43be948c5cabd56ef2bacffb77cdaa5eec49dd5eb0cc4129cf3eda5f0e74c",
  },
  {
    password: "master",
    sha256: "fc613b4dfd6736a7bd268c8a0e74ed0d1c04a959f59dd74ef2874983fd443fc9",
  },
  { password: "login", sha256: "428821350e9691491f616b754cd8315fb86d797ab35d843479e732ef90665324" },
  {
    password: "abc123",
    sha256: "6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090",
  },
  {
    password: "111111",
    sha256: "bcb15f821479b4d5772bd0ca866c00ad5f926e3580720659cc80d39c9d09802a",
  },
  {
    password: "trustno1",
    sha256: "203b70b5ae883932161bbd0bded9357e763e63afce98b16230be33f0b94c2cc5",
  },
  {
    password: "baseball",
    sha256: "a01edad91c00abe7be5b72b5e36bf4ce3c6f26e8bce3340eba365642813ab8b6",
  },
  {
    password: "shadow",
    sha256: "0bb09d80600eec3eb9d7793a6f859bedde2a2d83899b70bd78e961ed674b32f4",
  },
  {
    password: "michael",
    sha256: "34550715062af006ac4fab288de67ecb44793c3a05c475227241535f6ef7a81b",
  },
  {
    password: "football",
    sha256: "6382deaf1f5dc6e792b76db4a4a7bf2ba468884e000b25e7928e621e27fb23cb",
  },
  {
    password: "batman",
    sha256: "1532e76dbe9d43d0dea98c331ca5ae8a65c5e8e8b99d3e2a42ae989356f6242a",
  },
  {
    password: "access",
    sha256: "a0561fd649cdb6baa784055f051bad796ea0afef17fca38219549deeba4e8c1a",
  },
  { password: "hello", sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" },
  {
    password: "charlie",
    sha256: "b9dd960c1753459a78115d3cb845a57d924b6877e805b08bd01086ccdf34433c",
  },
  {
    password: "donald",
    sha256: "4138cfbc5d36f31e8ae09ef4044bb88c0c9c6f289a6a1c27b335a99d1d8dc86f",
  },
  {
    password: "sunshine",
    sha256: "a941a4c4fd0c01cddef61b8be963bf4c1e2b0811c037ce3f1835fddf6ef6c223",
  },
  {
    password: "princess",
    sha256: "04e77bf8f95cb3e1a36a59d1e93857c411930db646b46c218a0352e432023cf2",
  },
  {
    password: "iloveyou",
    sha256: "e4ad93ca07acb8d908a3aa41e920ea4f4ef4f26e7f86cf8291c5db289780a5ae",
  },
  {
    password: "starwars",
    sha256: "74fca0325b5fdb3a34badb40a2581cfbd5344187e8d3432952a5abc0929c1246",
  },
  {
    password: "passw0rd",
    sha256: "8f0e2f76e22b43e2855189877e7dc1e1e7d98c226c95db247cd1d547928334a9",
  },
  {
    password: "superman",
    sha256: "73cd1b16c4fb83061ad18a0b29b9643a68d4640075a466dc9e51682f84a847f5",
  },
  {
    password: "mustang",
    sha256: "a92f6bdb75789bccc118adfcf704029aa58063c604bab4fcdd9cd126ef9b69af",
  },
  {
    password: "matrix",
    sha256: "6e00cd562cc2d88e238dfb81d9439de7ec843ee9d0c9879d549cb1436786f975",
  },
  {
    password: "whatever",
    sha256: "85738f8f9a7f1b04b5329c590ebcb9e425925c6d0984089c43a022de4f19c281",
  },
  {
    password: "freedom",
    sha256: "13b1f7ec5beaefc781e43a3b344371cd49923a8a05edd71844b92f56f6a08d38",
  },
  {
    password: "flower",
    sha256: "c06b0cfe0cc5e900c57784484094331f095bf441995c3c31ea6c75691c786c35",
  },
  {
    password: "jordan",
    sha256: "136c67657614311f32238751044a0a3c0294f2a521e573afa8e496992d3786ba",
  },
  {
    password: "jennifer",
    sha256: "9ce8db922a8f4a7abd859adee70bd8b7a63321265487da54cf4bed6a69eb3e1b",
  },
  {
    password: "thomas",
    sha256: "d38681074467c0bc147b17a9a12b9efa8cc10bcf545f5b0bccccf5a93c4a2b79",
  },
  {
    password: "soccer",
    sha256: "8f27f432fcbaa4b5180a1cc7a8fa166a93cda3c1bce6f19922dd519d02f4bb39",
  },
  {
    password: "killer",
    sha256: "ed45d626b07112a8a501d9672f3b92796a6754b8d8d9cb4c617fec9774889220",
  },
  {
    password: "pepper",
    sha256: "8cbbcf29d9cef89675c5f5c1dcfe827d0570416a5aaba30dd0de159661ad905b",
  },
  {
    password: "cheese",
    sha256: "873ac9ffea4dd04fa719e8920cd6938f0c23cd678af330939cff53c3d2855f34",
  },
  {
    password: "robert",
    sha256: "4007d46292298e83da10d0763d95d5139fe0c157148d0587aa912170414ccba6",
  },
  {
    password: "summer",
    sha256: "e83664255c6963e962bb20f9fcfaad1b570ddf5da69f5444ed37e5260f3ef689",
  },
  {
    password: "ashley",
    sha256: "c64975ba3cf3f9cd58459710b0a42369f34b0759c9967fb5a47eea488e8bea79",
  },
  {
    password: "daniel",
    sha256: "bd3dae5fb91f88a4f0978222dfd58f59a124257cb081486387cbae9df11fb879",
  },
  {
    password: "harley",
    sha256: "37bfdcb4c50793a6286fa0efe07b9e6bba8605b2c32e329fb9f71f225545f027",
  },
  {
    password: "thunder",
    sha256: "49eff747f7b66f70133bfe00aa8ac2d6b0fbee5be80e52537b0163f147d20418",
  },
  {
    password: "ranger",
    sha256: "dbc4a04327176e6577b4da46df04564150053960eba5d89587dad1f76a818d80",
  },
  {
    password: "buster",
    sha256: "cbeaff314ef5ad032caa60ee2e8d8144ae52a8572c7d6f75631f3bd4080a7b16",
  },
  {
    password: "george",
    sha256: "0522a55e2d5f0993a3d66d28864b2862a7218a75ea7968b075333434404485c3",
  },
  {
    password: "secret",
    sha256: "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
  },
] as const;

export const RAINBOW_LOOKUP = new Map(RAINBOW_TABLE.map((e) => [e.sha256, e.password]));
