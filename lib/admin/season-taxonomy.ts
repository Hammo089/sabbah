// lib/admin/season-taxonomy.ts
// The exact vocabularies from the CAPDAMS "Season Details" layout, so a record
// migrated out of FileMaker keeps meaning the same thing here.

export type Term = { value: string; en: string; ar: string; fr: string };

/** Genres — the three-column checkbox grid, in the same order as the old form. */
export const GENRES: Term[] = [
  { value: 'action',          en: 'Action',           ar: 'أكشن',            fr: 'Action' },
  { value: 'adventure',       en: 'Adventure',        ar: 'مغامرة',          fr: 'Aventure' },
  { value: 'animation',       en: 'Animation',        ar: 'رسوم متحركة',     fr: 'Animation' },
  { value: 'biography',       en: 'Biography',        ar: 'سيرة ذاتية',      fr: 'Biographie' },
  { value: 'comedy',          en: 'Comedy',           ar: 'كوميديا',         fr: 'Comédie' },
  { value: 'conspiracy',      en: 'Conspiracy',       ar: 'مؤامرة',          fr: 'Complot' },
  { value: 'contemporary',    en: 'Contemporary',     ar: 'معاصر',           fr: 'Contemporain' },
  { value: 'cooking',         en: 'Cooking',          ar: 'طبخ',             fr: 'Cuisine' },
  { value: 'crime',           en: 'Crime',            ar: 'جريمة',           fr: 'Policier' },
  { value: 'drama',           en: 'Drama',            ar: 'دراما',           fr: 'Drame' },
  { value: 'entertainment',   en: 'Entertainment',    ar: 'ترفيه',           fr: 'Divertissement' },
  { value: 'family',          en: 'Family',           ar: 'عائلي',           fr: 'Famille' },
  { value: 'fantasy',         en: 'Fantasy',          ar: 'خيال',            fr: 'Fantastique' },
  { value: 'fiction',         en: 'Fiction',          ar: 'خيالي',           fr: 'Fiction' },
  { value: 'futuristic',      en: 'Futuristic',       ar: 'مستقبلي',         fr: 'Futuriste' },
  { value: 'game_show',       en: 'Game-Show',        ar: 'مسابقات',         fr: 'Jeu télévisé' },
  { value: 'history',         en: 'History',          ar: 'تاريخي',          fr: 'Histoire' },
  { value: 'horror',          en: 'Horror',           ar: 'رعب',             fr: 'Horreur' },
  { value: 'modern',          en: 'Modern',           ar: 'حديث',            fr: 'Moderne' },
  { value: 'movie',           en: 'Movie',            ar: 'فيلم',            fr: 'Film' },
  { value: 'music',           en: 'Music',            ar: 'موسيقى',          fr: 'Musique' },
  { value: 'musical',         en: 'Musical',          ar: 'استعراضي',        fr: 'Comédie musicale' },
  { value: 'mystery',         en: 'Mystery',          ar: 'غموض',            fr: 'Mystère' },
  { value: 'plays',           en: 'Plays',            ar: 'مسرحيات',         fr: 'Théâtre' },
  { value: 'psychological',   en: 'Psychological',    ar: 'نفسي',            fr: 'Psychologique' },
  { value: 'religion',        en: 'Religion',         ar: 'ديني',            fr: 'Religion' },
  { value: 'romance',         en: 'Romance',          ar: 'رومانسي',         fr: 'Romance' },
  { value: 'sarcasm',         en: 'Sarcasm',          ar: 'سخرية',           fr: 'Satire' },
  { value: 'science_fiction', en: 'Science Fiction',  ar: 'خيال علمي',       fr: 'Science-fiction' },
  { value: 'show',            en: 'Show',             ar: 'برنامج',          fr: 'Émission' },
  { value: 'sitcom',          en: 'Sitcom',           ar: 'سيتكوم',          fr: 'Sitcom' },
  { value: 'social',          en: 'Social',           ar: 'اجتماعي',         fr: 'Social' },
  { value: 'sports',          en: 'Sports',           ar: 'رياضة',           fr: 'Sport' },
  { value: 'suspense',        en: 'Suspense',         ar: 'تشويق',           fr: 'Suspense' },
  { value: 'thriller',        en: 'Thriller',         ar: 'إثارة',           fr: 'Thriller' },
  { value: 'thriller_romance',en: 'Thriller Romance', ar: 'تشويق رومانسي',   fr: 'Thriller romantique' },
];

/** Audio / Dubbing / Subtitling share one vocabulary in the old layout. */
export const LANGUAGES: Term[] = [
  { value: 'arabic',    en: 'Arabic',    ar: 'عربي',      fr: 'Arabe' },
  { value: 'egyptian',  en: 'Egyptian',  ar: 'مصري',      fr: 'Égyptien' },
  { value: 'french',    en: 'French',    ar: 'فرنسي',     fr: 'Français' },
  { value: 'german',    en: 'German',    ar: 'ألماني',    fr: 'Allemand' },
  { value: 'iraqi',     en: 'Iraqi',     ar: 'عراقي',     fr: 'Irakien' },
  { value: 'kuwaiti',   en: 'Kuwaiti',   ar: 'كويتي',     fr: 'Koweïtien' },
  { value: 'lebanese',  en: 'Lebanese',  ar: 'لبناني',    fr: 'Libanais' },
  { value: 'moroccan',  en: 'Moroccan',  ar: 'مغربي',     fr: 'Marocain' },
  { value: 'saudi',     en: 'Saudi',     ar: 'سعودي',     fr: 'Saoudien' },
  { value: 'spanish',   en: 'Spanish',   ar: 'إسباني',    fr: 'Espagnol' },
  { value: 'syrian',    en: 'Syrian',    ar: 'سوري',      fr: 'Syrien' },
  { value: 'tunisian',  en: 'Tunisian',  ar: 'تونسي',     fr: 'Tunisien' },
];

/** Subtitling in the old layout also offered these. */
export const SUBTITLE_LANGUAGES: Term[] = [
  ...LANGUAGES.filter((l) => ['arabic', 'french', 'german', 'spanish'].includes(l.value)),
  { value: 'english', en: 'English', ar: 'إنجليزي', fr: 'Anglais' },
  { value: 'russian', en: 'Russian', ar: 'روسي',    fr: 'Russe' },
  { value: 'turkish', en: 'Turkish', ar: 'تركي',    fr: 'Turc' },
].sort((a, b) => a.en.localeCompare(b.en));

export const REGIONS: Term[] = [
  { value: 'levant',  en: 'Levant',  ar: 'بلاد الشام', fr: 'Levant' },
  { value: 'egypt',   en: 'Egypt',   ar: 'مصر',        fr: 'Égypte' },
  { value: 'arabia',  en: 'Arabia',  ar: 'الجزيرة',    fr: 'Arabie' },
  { value: 'maghreb', en: 'Maghreb', ar: 'المغرب العربي', fr: 'Maghreb' },
  { value: 'other',   en: 'Other',   ar: 'أخرى',       fr: 'Autre' },
];

/**
 * The two read-only boxes under each grid on the CAPDAMS layout: the selected
 * terms, joined, in English and in Arabic. Computed rather than typed, so they
 * can never disagree with the checkboxes above them.
 */
export function joinTerms(values: string[], vocab: Term[], lang: 'en' | 'ar' | 'fr'): string {
  const order = new Map(vocab.map((term, i) => [term.value, i]));

  return values
    .filter((v) => order.has(v))
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
    .map((v) => vocab.find((term) => term.value === v)![lang])
    .join(lang === 'ar' ? '، ' : ', ');
}
