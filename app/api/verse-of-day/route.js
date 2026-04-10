const VERSES = {
  pt: [
    { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", ref: "João 3:16" },
    { text: "O Senhor é o meu pastor e nada me faltará.", ref: "Salmos 23:1" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.", ref: "Isaías 41:10" },
    { text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", ref: "Provérbios 3:5-6" },
    { text: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", ref: "Mateus 11:28" },
    { text: "Busca primeiro o reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
    { text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", ref: "Salmos 27:1" },
    { text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.", ref: "Jeremias 29:11" },
    { text: "Não vos conformeis com este século, mas transformai-vos pela renovação do vosso entendimento.", ref: "Romanos 12:2" },
    { text: "Sede fortes e corajosos. Não temais nem vos assusteis diante deles, pois o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará.", ref: "Deuteronômio 31:6" },
    { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", ref: "1 Coríntios 13:4" },
    { text: "Mas os que esperam no Senhor renovarão as suas forças. Voarão alto como águias; correrão e não ficarão exaustos, andarão e não se cansarão.", ref: "Isaías 40:31" },
    { text: "Porque pela graça sois salvos, mediante a fé; e isso não vem de vós; é dom de Deus.", ref: "Efésios 2:8" },
    { text: "E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", ref: "Romanos 8:28" },
    { text: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te seja gracioso.", ref: "Números 6:24-25" },
    { text: "Alegrai-vos sempre no Senhor. Outra vez digo: alegrai-vos!", ref: "Filipenses 4:4" },
    { text: "Não anseie pelo amanhã, pois o amanhã terá seus próprios problemas. Cada dia tem o suficiente de seu próprio trabalho.", ref: "Mateus 6:34" },
    { text: "Porque Deus não nos deu o espírito de temor, mas de poder, de amor e de moderação.", ref: "2 Timóteo 1:7" },
    { text: "Cria em mim, ó Deus, um coração puro, e renova dentro de mim um espírito firme.", ref: "Salmos 51:10" },
    { text: "O Senhor é misericordioso e justo; o nosso Deus é compassivo.", ref: "Salmos 116:5" },
    { text: "Entrega o teu caminho ao Senhor; confia nele, e ele agirá.", ref: "Salmos 37:5" },
    { text: "Portanto, não vos aflijais com o amanhã, pois o Senhor está perto.", ref: "Filipenses 4:6" },
    { text: "Não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desanimarmos.", ref: "Gálatas 6:9" },
    { text: "O Senhor está perto de todos os que o invocam, de todos os que o invocam com sinceridade.", ref: "Salmos 145:18" },
    { text: "Mas eu vos digo: Amai os vossos inimigos e orai pelos que vos perseguem.", ref: "Mateus 5:44" },
    { text: "Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações.", ref: "Salmos 46:1" },
    { text: "A palavra de Deus é viva e eficaz, e mais afiada do que qualquer espada de dois gumes.", ref: "Hebreus 4:12" },
    { text: "Aguarda o Senhor; sê forte, e que o teu coração se fortaleça; aguarda, pois, o Senhor.", ref: "Salmos 27:14" },
    { text: "Porque eu estou convicto de que nem a morte, nem a vida, nem os anjos, nem os principados, nem as potestades, nem o presente, nem o futuro poderão separar-nos do amor de Deus.", ref: "Romanos 8:38-39" },
  ],
  en: [
    { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", ref: "John 3:16" },
    { text: "The Lord is my shepherd, I lack nothing.", ref: "Psalm 23:1" },
    { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13" },
    { text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", ref: "Isaiah 41:10" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", ref: "Proverbs 3:5-6" },
    { text: "Come to me, all you who are weary and burdened, and I will give you rest.", ref: "Matthew 11:28" },
    { text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", ref: "Matthew 6:33" },
    { text: "The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?", ref: "Psalm 27:1" },
    { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
    { text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", ref: "Romans 12:2" },
    { text: "Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.", ref: "Deuteronomy 31:6" },
    { text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", ref: "1 Corinthians 13:4" },
    { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", ref: "Isaiah 40:31" },
    { text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God.", ref: "Ephesians 2:8" },
    { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", ref: "Romans 8:28" },
    { text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", ref: "Numbers 6:24-25" },
    { text: "Rejoice in the Lord always. I will say it again: Rejoice!", ref: "Philippians 4:4" },
    { text: "Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.", ref: "Matthew 6:34" },
    { text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.", ref: "2 Timothy 1:7" },
    { text: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", ref: "Psalm 51:10" },
    { text: "The Lord is gracious and righteous; our God is full of compassion.", ref: "Psalm 116:5" },
    { text: "Commit your way to the Lord; trust in him and he will do this.", ref: "Psalm 37:5" },
    { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", ref: "Philippians 4:6" },
    { text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", ref: "Galatians 6:9" },
    { text: "The Lord is near to all who call on him, to all who call on him in truth.", ref: "Psalm 145:18" },
    { text: "But I tell you, love your enemies and pray for those who persecute you.", ref: "Matthew 5:44" },
    { text: "God is our refuge and strength, an ever-present help in trouble.", ref: "Psalm 46:1" },
    { text: "For the word of God is alive and active. Sharper than any double-edged sword.", ref: "Hebrews 4:12" },
    { text: "Wait for the Lord; be strong and take heart and wait for the Lord.", ref: "Psalm 27:14" },
    { text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, will be able to separate us from the love of God.", ref: "Romans 8:38-39" },
  ],
  es: [
    { text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", ref: "Juan 3:16" },
    { text: "El Señor es mi pastor; nada me faltará.", ref: "Salmos 23:1" },
    { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Filipenses 4:13" },
    { text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.", ref: "Isaías 41:10" },
    { text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.", ref: "Proverbios 3:5-6" },
    { text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.", ref: "Mateo 11:28" },
    { text: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.", ref: "Mateo 6:33" },
    { text: "Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién me he de atemorizar?", ref: "Salmos 27:1" },
    { text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.", ref: "Jeremías 29:11" },
    { text: "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento.", ref: "Romanos 12:2" },
    { text: "Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos, porque Jehová tu Dios es el que va contigo; no te dejará, ni te desamparará.", ref: "Deuteronomio 31:6" },
    { text: "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece.", ref: "1 Corintios 13:4" },
    { text: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.", ref: "Isaías 40:31" },
    { text: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.", ref: "Efesios 2:8" },
    { text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.", ref: "Romanos 8:28" },
    { text: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia.", ref: "Números 6:24-25" },
    { text: "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos!", ref: "Filipenses 4:4" },
    { text: "Así que, no os afanéis por el día de mañana, porque el día de mañana traerá su afán. Basta a cada día su propio mal.", ref: "Mateo 6:34" },
    { text: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.", ref: "2 Timoteo 1:7" },
    { text: "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto dentro de mí.", ref: "Salmos 51:10" },
    { text: "Clemente es Jehová, y justo; sí, misericordioso es nuestro Dios.", ref: "Salmos 116:5" },
    { text: "Encomienda a Jehová tu camino, y confía en él; y él hará.", ref: "Salmos 37:5" },
    { text: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.", ref: "Filipenses 4:6" },
    { text: "No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.", ref: "Gálatas 6:9" },
    { text: "Cercano está Jehová a todos los que le invocan, a todos los que le invocan de veras.", ref: "Salmos 145:18" },
    { text: "Pero yo os digo: Amad a vuestros enemigos, bendecid a los que os maldicen, haced bien a los que os aborrecen, y orad por los que os ultrajan y os persiguen.", ref: "Mateo 5:44" },
    { text: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.", ref: "Salmos 46:1" },
    { text: "Porque la palabra de Dios es viva y eficaz, y más cortante que toda espada de dos filos.", ref: "Hebreos 4:12" },
    { text: "Aguarda a Jehová; esfuérzate, y aliéntese tu corazón; sí, espera a Jehová.", ref: "Salmos 27:14" },
    { text: "Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir, ni lo alto, ni lo profundo, nos podrá separar del amor de Dios.", ref: "Romanos 8:38-39" },
  ],
};

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "pt";
  const verses = VERSES[lang] || VERSES.pt;
  const index = getDayOfYear() % verses.length;
  const verse = verses[index];

  return Response.json(
    { text: verse.text, ref: verse.ref, date: new Date().toISOString().split("T")[0] },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    }
  );
}
