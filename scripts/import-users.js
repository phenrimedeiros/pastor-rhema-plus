import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const emails = [
  "4spr96og@gmail.com","7jamessantiago@gmail.com","abanouba@gmail.com","adri@tznlodge.co.za","adumensahjoseph@gmail.com","agbudz@yahoo.com","ajeyomiphillip@gmail.com","akoomson2005@yahoo.com","alabaojo1@yahoo.com","alexmaranan@yahoo.com","alfredbrim@yahoo.com","alixlazarre1@gmail.com","allneezins@gmail.com","alpurham@gmail.com","amigosbarbershop1342@gmail.com","andre@metallicacc.com","andrefalls49@gmail.com","angelolewis05@gmail.com","apostlebpowell@gmail.com","apouanitunasa@gmail.com","aregbesola9@gmail.com","armorerr@gmail.com","atty.randelty@gmail.com","babatunde.ifesanya@gmail.com","bagbagba@angelsschool.edu.gh","bartolotta_g@yahoo.it","batomjnr@gmail.com","bbcesvapastor@gmail.com","benboamah1@gmail.com","bengar66@gmail.com","benjie.bender@gmail.com","bennettmelonard@gmail.com","bennettsharon743@gmail.com","berttrude@cox.net","berttyih@gmail.com","biancahernandez@icloud.com","bishopchigbundu@gmail.com","bishopkdbarnes@gmail.com","bishoptrussell@gmail.com","bnlittle19@yahoo.com","boatdavis@hotmail.com","bpjonah@gmail.com","bruceguyton@hotmail.com","bryan@knowthegospel.com","buckleylivestock@gmail.com","carlstroseministry@yahoo.com","ccoyonkers@aol.com","cesdat@gmail.com","cfair01@yahoo.com","charlaineprice@gmail.com","charlie.ivamy@gmail.com","chernyang79@gmail.com","chrismcdanielmusic@gmail.com","chuckseagles@gmail.com","cindehar@aol.com","clintcarter1976@yahoo.com","cmrober@gmail.com","colinarenato@yahoo.com","collinsmexico@gmail.com","concetta1818@gmail.com","counci@aol.com","crocknroll12@yahoo.com","dabogbadyu3@gmail.com","danieldomengeaux@yahoo.com","david@abcmotors.com","davidpettway@hotmail.com","dbasilio41@gmail.com","dcanady@lifesteam.org","ddkotey2001@gmail.com","deltonellis@yahoo.com","dennis.sager@everynation.jp","denzilcooke409@gmail.com","derek@cuttingedgepackaging.co.za","derrickmdwyprk@gmail.com","dgosha1684@gmail.com","dikeutih@gmail.com","dk4854@yahoo.com","dllewis1029@gmail.com","dlwms63@gmail.com","dlyngdoh62@gmail.com","dmtikili@gmail.com","domnicanthonyscott@gmail.com","don@marupaati.com","doringbosbediening@gmail.com","dpburket@gmail.com","dr.ksimmons1961@gmail.com","dr.lorenzoc@yahoo.com","dr2vera@gmail.com","drbeverly.bh@gmail.com","drkstaffcalvarybcsd@gmail.com","dudleymans.dm@gmail.com","duduakpotor@yahoo.com","duknduk@gmail.com","earlrev@aol.com","ebianga.abule@gmail.com","echatawe@gmail.com","edfreshfire@gmail.com","ejs05931@verison.net","elcc9078@gmail.com","elderwgrandy@gmail.com","elmerruda@ymail.com","em102460@gmail.com","emanuel1.haygood@yahoo.com","ematema@sky.com","eme7070@gmail.com","emmurangira@gmail.com","epckjv@gmail.com","essien.akparawa@gmail.com","euinimariota15@gmail.com","eupaulointeligente@gmail.com","evebassett@telus.net","fanniesplace@yahoo.com","fatherdavidazer@gmail.com","fcann9893@gmail.com","feltojo60@gmail.com","flobaptist@yahoo.com","fnaidin@rogers.com","fnarterh@yahoo.com","fpuaka@outlook.com","franknana1@yahoo.com","frankonyeka13@gmail.com","friendly4u55@yahoo.com","fs.cornier@gmail.com","ftelfort@gmail.com","fuschupco@gmail.com","fyouhari@aol.com","ga_hummingbird30@yahoo.com","garrywward@outlook.com","ghpilot520@yahoo.com","glministry@netzero.com","glvrl@yahoo.com","gregk636@gmail.com","greglpollard@bellsouth.net","habwe2@gmail.com","haeane.676samu@gmail.com","hansevennilsen@gmail.com","haske.kudla@gmail.com","hclinton.hines@gmail.com","hebrewsministry0119@gmail.com","hectorpreach@gmail.com","hnelson1858@gmail.com","howardcarpenterjr@gmail.com","hubertwu@stouffvillegrace.ca","ilikanawaqa293@gmail.com","iloveagnes70@gmail.com","isamaela7@gmail.com","iuni.savusa@gmail.com","jacquelingokela@gmail.com","jairosjaja09@gmail.com","james1153@att.net","jamespierce8@gmail.com","jclordofglory@aol.com","jdavis77@hotmail.com","jenlou.ward@gmail.com","jessejenningsjr@gmail.com","jiyovwi@yahoo.com","jlmitch1961@gmail.com","joel.marq@yahoo.com","joemoore@midtel.net","joeserve@hotmail.com","johnny.trevino@twm-friona.com","johnnyfoster08@gmail.com","johnwambura@yahoo.com","josephedusei26@gmail.com","jrelsalmista@gmail.com","jsehflores@yahoo.com","judeandrew@yahoo.com","justinchia09@gmail.com","jwreidjr2566@gmail.com","kahumikewarren@gmail.com","katulwa@gmail.com","kbald721@gmail.com","kc.crum@yahoo.com","kelvincathlin4@gmail.com","kelvinmwale1997@gmail.com","kempdeerail@gmail.com","kenit03@msn.com","kesisthewo09@gmail.com","kevinringer01@gmail.com","kingeugene63@yahoo.com","kinuthiaeston@gmail.com","kipfreda60@yahoo.com","klee@pobox.com","kllongbiz@gmail.com","kolonelson21@gmail.com","ksmith9900@hotmail.com","lampsibrasil@gmail.com","lanellg@aol.com","lcfaog@gmail.com","lee2beraph@gmail.com","leezyc@outlook.com","leuluaiken19@gmail.com","lewikam@gmail.com","lewisgurley4@gmail.com","lifechoice@live.com","llwmariana@gmail.com","lrob203@gmail.com","maheraljamal@gmail.com","malombo.ignite@gmail.com","manoalesu@gmail.com","marilynharp65@gmail.com","markfcabigon@aol.com","markkallberg@aol.com","maxtuitele@gmail.com","mbelleres@hotmail.com","mcathin@gmail.com","mchenrycpa107@gmail.com","mgsmith@majcomputers.com","mikehatch@estate.lvcoxmail.com","mkouaho@aol.com","moffatshawa@yahoo.com","mommassaquoi@icloud.com","mondesir857@yahoo.com","montezjones909@yahoo.com","moremanna42@gmail.com","morenoperico.castro@gmail.com","mrsmdaka@yahoo.com","mtcalvary.kevin@yahoo.com","mudzihome@yahoo.com","munar_jerry07@yahoo.com","mundemuk@gmail.com","mwtshabs@gmail.com","mymechanic0528@icloud.com","mytips4life@gmail.com","napasco72@gmail.com","nealwhitney@woh.rr.com","niiaddo2002@gmail.com","nikesohe@hotmail.com","nsquiming@up.edu.ph","okosejames@gmail.com","olatunjibakare@gmail.com","old65soldier@yahoo.com","olychim@gmail.com","omnipotentlord13@gmail.com","oneblt2@yahoo.com","paladinpestcontrol@gmail.com","papo2454@yahoo.com","pastor@watersedge.faith","pastorbillymyers@aol.com","pastorbriansmail@yahoo.com","pastored1@yahoo.com","pastorgilbert@amazinggracejp.org","pastorjeffccpv@gmail.com","pastorjerry5646@gmail.com","pastorlam@agapecac.org","pastormitch65@gmail.com","pastoronque@aol.com","pastorraymondgh@yahoo.com","pastorteuchert@gmail.com","paulo@lampsi.com.br","pdboe200368@gmail.com","pedromovrios@gmail.com","philohis@yahoo.com","pikn4jesus@gmail.com","piruchito7@gmail.com","pjlford@gmail.com","pkhubani255@gmail.com","pleplumbing@gmail.com","popdavis@gmail.com","ppmkjones55@yahoo.com","preacherxodus@yahoo.com","prestonlscottjr1@hotmail.com","prgamini@gmail.com","prjac5_71446@yahoo.com","prrop@aol.com","prsjama@gmail.com","pslara64@gmail.com","qrmcghee1@gmail.com","r_namayanja@yahoo.com","raguiller@me.com","rakent73@gmail.com","rangasamymv@gmail.com","rawells66@gmail.com","ray.lucero@gmail.com","reaskew@gmail.com","reggiezumel@ymail.com","renard4peyton@gmail.com","rennie32@gmail.com","reuben.reed@gmail.com","reverence2005@yahoo.com","reverendmarco@gmail.com","revfrankc@gmail.com","revjoanskyers@verizon.net","revpapah@gmail.com","revpaulbeard@gmail.com","revronnie.lwf@gmail.com","revtok@msn.com","rhodrodriguez1967@gmail.com","richard.hatfield3@gmail.com","richardhgrant@gmail.com","rick@kressconsulting.net","rickoenglish65@gmail.com","riel.pasaribu@yahoo.com","rlauderdalesr@gmail.com","robinsonbennie@gmail.com","rompreachear@yahoo.com","ronaldb9292@gmail.com","ronniesison@hotmail.com","roskoby@yahoo.com","royaluvpurple1@att.net","royamckoy@gmail.com","rrobinrev@gmail.com","rudolphmhyde@gmail.com","rutivi.alois@gmail.com","saami40.ds@gmail.com","sageteri@yahoo.com","salufurai@gmail.com","samkechmfm@gmail.com","sandwhouse@comcast.net","sariejoyce05@gmail.com","satishmanmothe@gmail.com","sct_30@yahoo.com","serbma@aol.com","sgtmichaellewis@yahoo.com","sherrypdrew40@gmail.com","sheyi40@yahoo.co.uk","shijansantos@gmail.com","slabachnathaniel@gmail.com","sngaho2u@gmail.com","solomonowo@yahoo.com","stanls400@yahoo.com","stepdeen@outlook.com","steve.miller94@yahoo.com","stvnweems@aol.com","talakai@xtra.co.nz","tamifisk@yahoo.com","tande11205@aol.com","tapualapenu@gmail.com","teste@rhema.com","tlcpro1980@gmail.com","tmoeng16v@gmail.com","tofilau.lemalu@outlook.com.au","torupera@bigpond.com","trsmi6000@gmail.com","tsumpter1951@gmail.com","ttddcross@aol.com","tuinabewa3@gmail.com","twsisney@yahoo.com","uklingthang@gmail.com","unshep@aol.com","venebeli@gmail.com","victorageh1@gmail.com","victoryassembly@gmail.com","vishnu.diakoneo@gmail.com","wallyup@msn.com","walterlaidler@aol.com","wcowart612@gmail.com","wcque1966@gmail.com","wdorsey6208@gmail.com","webbcf9@gmail.com","weperky@gmail.com","williamktjohnson@gmail.com","wilstephenci@yahoo.com","withrow1976@gmail.com","woodster17@gmail.com","writelave96@gmail.com","wshanks12@yahoo.com","wushishi.yusuf@wcc-coe.org","xersnell@yahoo.com","xexemeku@gmail.com","xolman@yahoo.com","yonnamk@gmail.com",
];

async function importUsers() {
  console.log(`Carregando usuários existentes no Supabase...`);

  // Busca todos os usuários existentes e monta mapa email → id
  const emailToId = {};
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) emailToId[u.email] = u.id;
    if (data.users.length < 1000) break;
    page++;
  }

  console.log(`${Object.keys(emailToId).length} usuários encontrados no banco.\n`);
  console.log(`Processando ${emails.length} emails da planilha...\n`);

  let criados = 0;
  let atualizados = 0;
  let erros = 0;

  for (const email of emails) {
    const existingId = emailToId[email];

    if (existingId) {
      // Usuário já existe — apenas atualiza a senha
      const { error } = await supabase.auth.admin.updateUserById(existingId, {
        password: "rhema123",
        email_confirm: true,
      });
      if (error) {
        console.log(`✗  erro ao atualizar ${email}: ${error.message}`);
        erros++;
      } else {
        console.log(`🔑 senha atualizada: ${email}`);
        atualizados++;
      }
    } else {
      // Usuário novo — cria com senha
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: "rhema123",
        email_confirm: true,
      });
      if (error) {
        console.log(`✗  erro ao criar ${email}: ${error.message}`);
        erros++;
      } else {
        console.log(`✓  criado: ${email} (${data.user.id})`);
        criados++;
      }
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`✓  Criados:          ${criados}`);
  console.log(`🔑 Senhas atualizadas: ${atualizados}`);
  console.log(`✗  Erros:            ${erros}`);
  console.log(`═══════════════════════════════`);
}

importUsers();
