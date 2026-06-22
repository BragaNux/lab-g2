"""Popula o banco com livros, trechos e desafios para teste."""
from datetime import date, timedelta
from app.database import SessionLocal
from app.models.book import Book
from app.models.passage import Passage, DailyChallenge
import app.models  # noqa: registra todos os models
from app.utils import get_local_date

# Livros marcados com era: "modern" = publicados após 1980 / "classic" = anteriores
BOOKS = [
    # ── CLÁSSICOS BRASILEIROS ──────────────────────────────────────────────────
    {
        "title": "Dom Casmurro",
        "author": "Machado de Assis",
        "year": 1899,
        "language": "pt",
        "passages": [
            {
                "text": "Fui ao teatro, e voltei em paz comigo. Na rua, olhei para o céu: as estrelas rutilavam sem distração, como se o universo fosse uma grande festa da qual eu não era convidado.",
                "difficulty": 2,
            },
            {
                "text": "Capitu olhou para mim, e eu senti que aqueles olhos de ressaca me puxavam para dentro. Eram olhos oblíquos e dissimulados, mas havia neles alguma coisa que me prendia.",
                "difficulty": 3,
            },
            {
                "text": "Não me peças que eu acredite em coisa alguma. A experiência da vida mostra que as aparências enganam sempre, e que o amor perfeito é uma fantasia de adolescentes.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Memórias Póstumas de Brás Cubas",
        "author": "Machado de Assis",
        "year": 1881,
        "language": "pt",
        "passages": [
            {
                "text": "Ao verme que primeiro roeu as frias carnes do meu cadáver dedico como saudosa lembrança estas memórias póstumas.",
                "difficulty": 4,
            },
            {
                "text": "Não tive filhos, não transmiti a nenhuma criatura o legado da nossa miséria. É o que digo com certo alívio, no fim desta história.",
                "difficulty": 3,
            },
            {
                "text": "O defunto autor começou a escrever um livro defunto, com a tinta da melancolia e a pena da galhofa.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "O Cortiço",
        "author": "Aluísio Azevedo",
        "year": 1890,
        "language": "pt",
        "passages": [
            {
                "text": "E aquela promiscuidade prosseguia, animal, suja, com o cheiro forte da carne viva, fumegante ao sol, no meio de moscas e mosquitos que zumbiam, pesados e sonolentos.",
                "difficulty": 3,
            },
            {
                "text": "O cortiço acordava, abrindo, não os olhos, mas a sua infinidade de portas e janelas alinhadas.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "Iracema",
        "author": "José de Alencar",
        "year": 1865,
        "language": "pt",
        "passages": [
            {
                "text": "Verdes mares bravios de minha terra natal, onde canta a jandaia nas frondes da carnaúba; verdes mares que brilhais como líquida esmeralda aos raios do sol nascente.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "Vidas Secas",
        "author": "Graciliano Ramos",
        "year": 1938,
        "language": "pt",
        "passages": [
            {
                "text": "A terra era dura e rachada sob o sol implacável. Fabiano olhou para os filhos, para a cachorra Baleia, e sentiu o peso do mundo seco sobre os ombros. Era preciso caminhar, sempre caminhar, sem saber para onde.",
                "difficulty": 3,
            },
            {
                "text": "Baleia queria dormir. Acordaria feliz, num mundo cheio de preás. E lamberia as mãos de Fabiano, um Fabiano enorme. As crianças se aproximariam dela, rindo. Tudo seria diferente.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Macunaíma",
        "author": "Mário de Andrade",
        "year": 1928,
        "language": "pt",
        "passages": [
            {
                "text": "No fundo do mato-virgem nasceu Macunaíma, herói de nossa gente. Era feio e preguiçoso, mas tinha astúcia. Logo no primeiro dia de vida fez tantas artes que sua mãe já não sabia o que fazer com ele.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "A Moreninha",
        "author": "Joaquim Manuel de Macedo",
        "year": 1844,
        "language": "pt",
        "passages": [
            {
                "text": "Ela era uma dessas criaturas que parecem nascidas unicamente para enfeitar o mundo, e que passam pela vida como um clarão de luz que ilumina sem queimar.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "O Guarani",
        "author": "José de Alencar",
        "year": 1857,
        "language": "pt",
        "passages": [
            {
                "text": "No alto da colina, rodeado de florestas onde o jaguar rondava e o índio caçava, erguia-se a casa do fidalgo português. Cecília bordava à janela enquanto o sol descia devagar sobre o rio Paquequer.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Grande Sertão: Veredas",
        "author": "João Guimarães Rosa",
        "year": 1956,
        "language": "pt",
        "passages": [
            {
                "text": "O diabo não existe? Existe sim. O senhor queira me ouvir bem: o diabo vive dentro do homem. Ah, eu sei que o senhor não acredita nisso, mas como é que sabe?",
                "difficulty": 4,
            },
            {
                "text": "Nonada. Tiros que o senhor ouviu foram de briga de homem, não de guerra. A Guerra de Canudos não foi minha.",
                "difficulty": 5,
            },
        ],
    },
    {
        "title": "A Hora da Estrela",
        "author": "Clarice Lispector",
        "year": 1977,
        "language": "pt",
        "passages": [
            {
                "text": "Tudo no mundo começou com um sim. Uma molécula disse sim a outra molécula e nasceu a vida.",
                "difficulty": 3,
            },
            {
                "text": "Ela era uma moça de dezessete anos e não sabia que era jovem. Nem sabia que a pobreza era sua condição e não apenas acidente.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Capitães da Areia",
        "author": "Jorge Amado",
        "year": 1937,
        "language": "pt",
        "passages": [
            {
                "text": "Pedro Bala era livre como o vento que soprava das ilhas. Filho das ruas de Salvador, não tinha dono, não tinha lei, só tinha o mar e os companheiros.",
                "difficulty": 2,
            },
            {
                "text": "Os capitães da areia eram donos da noite de Salvador, correndo pelas ladeiras como ratos, dormindo nos velhos armazéns do cais do porto.",
                "difficulty": 3,
            },
        ],
    },
    # ── FANTASIA & AVENTURA (CLÁSSICA) ────────────────────────────────────────
    {
        "title": "O Hobbit",
        "author": "J.R.R. Tolkien",
        "year": 1937,
        "language": "en",
        "passages": [
            {
                "text": "Num buraco no chão vivia um hobbit. Não um buraco sujo, desagradável e úmido, cheio de restos de minhocas e com cheiro de lodo, nem tampouco um buraco seco, arenoso e vazio, sem nada em que sentar ou o que comer: era um buraco de hobbit, e isso quer dizer conforto.",
                "difficulty": 2,
            },
            {
                "text": "Se a maioria de nós valorizasse a comida, a bebida e a canção acima do ouro acumulado, seria um mundo mais feliz.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "O Senhor dos Anéis: A Sociedade do Anel",
        "author": "J.R.R. Tolkien",
        "year": 1954,
        "language": "en",
        "passages": [
            {
                "text": "Nem todo aquele que vagueia está perdido. As raízes profundas não são atingidas pela geada; dos cinzas a chama dourada jamais morreu; das sombras brotará a luz, a espada partida será restaurada.",
                "difficulty": 3,
            },
            {
                "text": "Até o menor dos seres pode mudar o curso do futuro. Isso é o que me encoraja.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Alice no País das Maravilhas",
        "author": "Lewis Carroll",
        "year": 1865,
        "language": "en",
        "passages": [
            {
                "text": "Poderia me dizer, por favor, qual caminho devo tomar para sair daqui? Isso depende bastante de onde você quer chegar, disse o Gato.",
                "difficulty": 2,
            },
            {
                "text": "Comece pelo começo, disse o Rei, muito gravemente, e continue até chegar ao fim: depois pare.",
                "difficulty": 3,
            },
        ],
    },
    # ── CLÁSSICOS OCIDENTAIS ──────────────────────────────────────────────────
    {
        "title": "Don Quixote",
        "author": "Miguel de Cervantes",
        "year": 1605,
        "language": "es",
        "passages": [
            {
                "text": "Em um lugar da Mancha, de cujo nome não quero lembrar-me, não há muito tempo que vivia um fidalgo dos de lança em cabido, adarga antiga, rocim flaco e galgo corredor.",
                "difficulty": 3,
            },
            {
                "text": "A virtude mais é perseguida dos maus que amada dos bons. A verdade emagrece, mas não quebra, e sempre anda sobre a mentira, como o azeite sobre a água.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Hamlet",
        "author": "William Shakespeare",
        "year": 1603,
        "language": "en",
        "passages": [
            {
                "text": "Ser ou não ser, eis a questão: será mais nobre em nosso espírito sofrer pedradas e flechadas de um destino hostil, ou armar-se contra um mar de contrariedades?",
                "difficulty": 2,
            },
            {
                "text": "Há mais coisas entre o céu e a terra, Horácio, do que sonha a sua filosofia.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Orgulho e Preconceito",
        "author": "Jane Austen",
        "year": 1813,
        "language": "en",
        "passages": [
            {
                "text": "É uma verdade universalmente conhecida que um homem solteiro, possuidor de uma boa fortuna, deve estar necessitado de uma esposa.",
                "difficulty": 2,
            },
            {
                "text": "Em vão tenho lutado. De nada serve. Meus sentimentos não podem ser reprimidos. Permita-me dizer-lhe com que ardor a admiro e a amo.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "O Pequeno Príncipe",
        "author": "Antoine de Saint-Exupéry",
        "year": 1943,
        "language": "fr",
        "passages": [
            {
                "text": "O essencial é invisível aos olhos. Só se vê bem com o coração.",
                "difficulty": 2,
            },
            {
                "text": "Tu te tornas eternamente responsável por aquilo que cativas.",
                "difficulty": 2,
            },
            {
                "text": "Se tu vens, por exemplo, às quatro da tarde, desde as três eu começarei a ser feliz.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "year": 1949,
        "language": "en",
        "passages": [
            {
                "text": "Quem controla o passado controla o futuro; quem controla o presente controla o passado.",
                "difficulty": 3,
            },
            {
                "text": "Guerra é Paz. Liberdade é Escravidão. Ignorância é Força.",
                "difficulty": 2,
            },
            {
                "text": "Se você quer uma imagem do futuro, imagine uma bota prensando um rosto humano para sempre.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "O Grande Gatsby",
        "author": "F. Scott Fitzgerald",
        "year": 1925,
        "language": "en",
        "passages": [
            {
                "text": "Em meus anos mais jovens e vulneráveis, meu pai me deu um conselho que tenho remoído desde então. 'Sempre que tiver vontade de criticar alguém', ele me disse, 'lembre-se de que nem todas as pessoas neste mundo tiveram as vantagens que você teve.'",
                "difficulty": 3,
            },
            {
                "text": "Assim prosseguimos, barcos contra a corrente, empurrados incessantemente de volta ao passado.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "A Metamorfose",
        "author": "Franz Kafka",
        "year": 1915,
        "language": "de",
        "passages": [
            {
                "text": "Numa manhã, ao despertar de sonhos inquietos, Gregor Samsa deu por si na cama transformado num gigantesco inseto.",
                "difficulty": 2,
            },
            {
                "text": "A verdade é que as pessoas gostam de ver os outros sofrerem, desde que o sofrimento não as atinja diretamente.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Moby Dick",
        "author": "Herman Melville",
        "year": 1851,
        "language": "en",
        "passages": [
            {
                "text": "Chamem-me Ismael. Há alguns anos — não importa quantos exatamente — com pouco ou nenhum dinheiro na carteira, e nada de particular que me interessasse em terra, pensei em navegar um pouco e ver a parte aquática do mundo.",
                "difficulty": 2,
            },
            {
                "text": "Não está em nenhum mapa; os lugares verdadeiros nunca estão.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Crime e Castigo",
        "author": "Fiódor Dostoiévski",
        "year": 1866,
        "language": "ru",
        "passages": [
            {
                "text": "Partir para um novo caminho, dar um novo passo, é o que as pessoas mais temem.",
                "difficulty": 3,
            },
            {
                "text": "Mentir de acordo com o próprio cérebro é quase melhor do que dizer a verdade de acordo com o cérebro dos outros.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "O Retrato de Dorian Gray",
        "author": "Oscar Wilde",
        "year": 1890,
        "language": "en",
        "passages": [
            {
                "text": "A única maneira de se livrar de uma tentação é ceder a ela. Se lhe resistirmos, a nossa alma ficará doente, desejando as coisas que se proibiu a si própria.",
                "difficulty": 3,
            },
            {
                "text": "O artista é o criador de coisas belas. Revelar a arte e ocultar o artista é o objetivo da arte.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Cem Anos de Solidão",
        "author": "Gabriel García Márquez",
        "year": 1967,
        "language": "es",
        "passages": [
            {
                "text": "Muitos anos depois, diante do pelotão de fuzilamento, o Coronel Aureliano Buendía havia de recordar aquela tarde remota em que seu pai o levou para conhecer o gelo.",
                "difficulty": 2,
            },
            {
                "text": "O mundo era tão recente que muitas coisas careciam de nome, e para mencioná-las era preciso apontar com o dedo.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Frankenstein",
        "author": "Mary Shelley",
        "year": 1818,
        "language": "en",
        "passages": [
            {
                "text": "Eu sou malvado porque sou infeliz. Por acaso não sou rejeitado e odiado por toda a humanidade?",
                "difficulty": 3,
            },
            {
                "text": "Nada é tão doloroso para a mente humana quanto uma mudança grande e repentina.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "A Divina Comédia",
        "author": "Dante Alighieri",
        "year": 1320,
        "language": "it",
        "passages": [
            {
                "text": "No meio do caminho de nossa vida, me encontrei em uma selva escura, pois a via reta se perdera.",
                "difficulty": 3,
            },
            {
                "text": "Deixai toda esperança, ó vós que entrais.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "Guerra e Paz",
        "author": "Liev Tolstói",
        "year": 1869,
        "language": "ru",
        "passages": [
            {
                "text": "Todos pensam em mudar o mundo, mas ninguém pensa em mudar a si mesmo.",
                "difficulty": 2,
            },
            {
                "text": "Pierre não disse nada, mas sentiu que algo nele havia mudado para sempre. O céu estrelado sobre o campo de batalha parecia infinitamente mais real do que tudo o que ele havia perseguido antes.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "O Conde de Monte Cristo",
        "author": "Alexandre Dumas",
        "year": 1844,
        "language": "fr",
        "passages": [
            {
                "text": "Esperar e esperar! É a grande sabedoria do homem que foi injustiçado. O mundo pertence a quem tem paciência.",
                "difficulty": 3,
            },
            {
                "text": "Toda a sabedoria humana está contida nestas duas palavras: Esperar e Esperançar.",
                "difficulty": 2,
            },
        ],
    },
    # ── FANTASIA & FICÇÃO CIENTÍFICA MODERNA ──────────────────────────────────
    {
        "title": "Harry Potter e a Pedra Filosofal",
        "author": "J.K. Rowling",
        "year": 1997,
        "language": "en",
        "passages": [
            {
                "text": "Era um garoto que sobreviveu — e não porque era especial, ou poderoso, ou predestinado, mas simplesmente porque alguém o amou incondicionalmente.",
                "difficulty": 2,
            },
            {
                "text": "A felicidade pode ser encontrada até nas horas mais sombrias, se apenas nos lembramos de acender a luz.",
                "difficulty": 2,
            },
            {
                "text": "Não importa que você tenha sangue de trouxa ou sangue puro. O que importa é o que você faz com o que tem.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Harry Potter e as Relíquias da Morte",
        "author": "J.K. Rowling",
        "year": 2007,
        "language": "en",
        "passages": [
            {
                "text": "Os mortos que amamos nunca partem de verdade. Eles continuam a viver em nossos corações.",
                "difficulty": 2,
            },
            {
                "text": "Não tente ser grande. Seja bom. Ninguém está realmente morto enquanto o seu nome ainda é dito.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa",
        "author": "C.S. Lewis",
        "year": 1950,
        "language": "en",
        "passages": [
            {
                "text": "Nárnia, Nárnia, Nárnia, desperta. Ama. Pensa. Fala. Seja árvores andantes. Seja bestas falantes. Seja águas divinas.",
                "difficulty": 3,
            },
            {
                "text": "Não era uma leoa? Não era um bicho? Não era uma coisa para se ter medo? Claro que sim, mas que diferença faz o medo quando você está ao lado de alguém que cuida de você?",
                "difficulty": 4,
            },
        ],
    },
    # ── YOUNG ADULT & AVENTURA MODERNA ───────────────────────────────────────
    {
        "title": "As Crônicas de Gelo e Fogo: A Guerra dos Tronos",
        "author": "George R.R. Martin",
        "year": 1996,
        "language": "en",
        "passages": [
            {
                "text": "Quando você joga o jogo dos tronos, você vence ou você morre. Não há meio-termo.",
                "difficulty": 2,
            },
            {
                "text": "O vento do inverno sopra do norte, e traz consigo o presságio de que os mortos voltarão. Ned Stark sentia isso nos ossos enquanto o gelo da Muralha se aprofundava.",
                "difficulty": 3,
            },
            {
                "text": "Um homem pode ser corajoso por muitas razões, mas os Stark sempre souberam que a honra pode ser a coisa mais pesada que um homem pode carregar.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Jogos Vorazes",
        "author": "Suzanne Collins",
        "year": 2008,
        "language": "en",
        "passages": [
            {
                "text": "Eu me ofereço como voluntária! Eu me ofereço como tributo! Essas palavras saíram antes que eu pensasse, mas quando saíram soube que eram as únicas que eu poderia dizer.",
                "difficulty": 2,
            },
            {
                "text": "Espero que o Peeta e eu nunca mais precisemos ser inimigos. Mas estou feliz de ter vivido esta vida, por mais dolorosa que tenha sido. Porque ela era real.",
                "difficulty": 3,
            },
            {
                "text": "Lembrem-se de quem é o inimigo. Não de nós. O inimigo é o Capitólio, e é ele que devemos derrubar.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Percy Jackson e o Ladrão de Raios",
        "author": "Rick Riordan",
        "year": 2005,
        "language": "en",
        "passages": [
            {
                "text": "Olha, não pedi para ser filho de um deus grego. Na maioria das vezes, gostaria de não ser. Mas com os monstros que vinham atrás de mim, o que eu podia fazer?",
                "difficulty": 2,
            },
            {
                "text": "Sendo meio-sangue, você passa a vida tentando encaixar em dois mundos e não consegue pertencer a nenhum dos dois. É esgotante.",
                "difficulty": 2,
            },
            {
                "text": "Grover estava convencido de que eu era especial. Não sabia se concordava com ele, mas havia uma coisa que eu sabia: quando a luta começa, você descobre quem você realmente é.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Divergente",
        "author": "Veronica Roth",
        "year": 2011,
        "language": "en",
        "passages": [
            {
                "text": "Ser corajosa não significa que você não tem medo. Significa que você escolhe seguir em frente apesar do medo.",
                "difficulty": 2,
            },
            {
                "text": "Eu não pertenço a nenhuma facção. Sou Divergente. E ninguém pode me controlar.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "O Labirinto",
        "author": "James Dashner",
        "year": 2009,
        "language": "en",
        "passages": [
            {
                "text": "Thomas acordou na escuridão. Não sabia onde estava, quem era, ou como chegara até ali. Só sabia que estava com medo — e que havia algo se movendo nas sombras ao redor dele.",
                "difficulty": 2,
            },
            {
                "text": "Se você quer sobreviver ao Labirinto, não pode ter medo do que está lá dentro. O medo é o labirinto real.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Maze Runner: A Cura Mortal",
        "author": "James Dashner",
        "year": 2011,
        "language": "en",
        "passages": [
            {
                "text": "Depois de tudo que havia passado, Thomas sabia que a única coisa que importava era a pessoa ao seu lado. O mundo podia desmoronar, mas enquanto houvesse alguém em quem confiar, haveria esperança.",
                "difficulty": 3,
            },
        ],
    },
    # ── FICÇÃO CIENTÍFICA MODERNA ─────────────────────────────────────────────
    {
        "title": "Ender's Game",
        "author": "Orson Scott Card",
        "year": 1985,
        "language": "en",
        "passages": [
            {
                "text": "O inimigo é a porta. A porta não tem face. Mas quem está do outro lado é um ser tão real e tão cheio de esperança quanto você. Por isso a guerra é sempre uma tragédia.",
                "difficulty": 4,
            },
            {
                "text": "Ender percebeu que o jogo nunca foi sobre vencer. Foi sobre entender — e entender o inimigo tão profundamente a ponto de amá-lo.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Duna",
        "author": "Frank Herbert",
        "year": 1965,
        "language": "en",
        "passages": [
            {
                "text": "Não devo ter medo. O medo é o assassino da mente. O medo é a pequena morte que conduz à obliteração total.",
                "difficulty": 3,
            },
            {
                "text": "O começo de todo conhecimento é a consciência de que não se sabe. A arrogância é a inimiga do aprendizado.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "O Guia do Mochileiro das Galáxias",
        "author": "Douglas Adams",
        "year": 1979,
        "language": "en",
        "passages": [
            {
                "text": "A resposta para a pergunta definitiva sobre a vida, o universo e tudo mais é quarenta e dois.",
                "difficulty": 2,
            },
            {
                "text": "Não entre em pânico. São as palavras mais reconfortantes escritas em qualquer idioma, em qualquer galáxia.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "Eu, Robô",
        "author": "Isaac Asimov",
        "year": 1950,
        "language": "en",
        "passages": [
            {
                "text": "Um robô não pode ferir um ser humano ou, por inação, permitir que um ser humano sofra dano. Essa é a Primeira Lei — e de todas as leis, a mais sagrada.",
                "difficulty": 3,
            },
            {
                "text": "A lógica é a ferramenta mais poderosa do universo, mas apenas quando usada com sabedoria e compaixão.",
                "difficulty": 4,
            },
        ],
    },
    # ── THRILLER & MISTÉRIO MODERNO ───────────────────────────────────────────
    {
        "title": "O Código Da Vinci",
        "author": "Dan Brown",
        "year": 2003,
        "language": "en",
        "passages": [
            {
                "text": "Os segredos mais perigosos são aqueles que todo mundo sabe, mas ninguém ousa pronunciar em voz alta.",
                "difficulty": 2,
            },
            {
                "text": "A história é escrita pelos vencedores. E quando os vencedores também controlam os altares, a história torna-se doutrina.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Inferno",
        "author": "Dan Brown",
        "year": 2013,
        "language": "en",
        "passages": [
            {
                "text": "O lugar mais sombrio do inferno é reservado para aqueles que mantêm sua neutralidade em tempos de crise moral.",
                "difficulty": 3,
            },
        ],
    },
    # ── ROMANCE & DRAMA MODERNO ───────────────────────────────────────────────
    {
        "title": "A Culpa é das Estrelas",
        "author": "John Green",
        "year": 2012,
        "language": "en",
        "passages": [
            {
                "text": "Não escolhemos nascer. Não escolhemos nossos pais. Não escolhemos o país ou a cidade em que nascemos. Mas podemos escolher a forma como vamos amar.",
                "difficulty": 2,
            },
            {
                "text": "Às vezes dói. As coisas mais bonitas às vezes doem. Mas isso não significa que não valem a pena.",
                "difficulty": 2,
            },
            {
                "text": "Okay é a melhor palavra que existe. Okay é perfeito no seu tamanho pequeno. Okay contém tudo.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Crepúsculo",
        "author": "Stephenie Meyer",
        "year": 2005,
        "language": "en",
        "passages": [
            {
                "text": "Sobre o meu coração, havia uma coisa absolutamente certa: eu estava apaixonada por um vampiro. Não havia como isso terminar bem.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "O Alquimista",
        "author": "Paulo Coelho",
        "year": 1988,
        "language": "pt",
        "passages": [
            {
                "text": "Quando você quer alguma coisa, todo o Universo conspira para que você realize o seu desejo.",
                "difficulty": 2,
            },
            {
                "text": "Existe apenas uma coisa que torna um sonho impossível de realizar: o medo de fracassar.",
                "difficulty": 2,
            },
            {
                "text": "Onde está o seu tesouro, aí estará também o seu coração.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Brida",
        "author": "Paulo Coelho",
        "year": 1990,
        "language": "pt",
        "passages": [
            {
                "text": "Cada pessoa que passa em nossa vida é única. Sempre deixa um pouco de si e leva um pouco de nós.",
                "difficulty": 2,
            },
        ],
    },
    # ── CLÁSSICOS MODERNOS (LITERATURA SÉRIA) ─────────────────────────────────
    {
        "title": "Cem Anos de Solidão",
        "author": "Gabriel García Márquez",
        "year": 1967,
        "language": "es",
        "passages": [],  # já adicionado acima
    },
    {
        "title": "O Nome da Rosa",
        "author": "Umberto Eco",
        "year": 1980,
        "language": "it",
        "passages": [
            {
                "text": "Os livros não foram feitos para acreditarmos neles, mas para serem submetidos à investigação. Diante de um livro não devemos perguntar o que ele diz, mas o que ele quer dizer.",
                "difficulty": 4,
            },
            {
                "text": "A beleza de um rosto está nos olhos de quem o vê. A beleza de um livro está na mente de quem o lê.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Ensaio sobre a Cegueira",
        "author": "José Saramago",
        "year": 1995,
        "language": "pt",
        "passages": [
            {
                "text": "Creio que não cegamos, creio que estamos cegos, Cegos que veem, Cegos que, vendo, não veem.",
                "difficulty": 4,
            },
            {
                "text": "Quem não consegue viver em sociedade, ou é um deus ou uma besta — mas cegamos para as coisas que importam e enxergamos apenas o que nos convém.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "A Insustentável Leveza do Ser",
        "author": "Milan Kundera",
        "year": 1984,
        "language": "cs",
        "passages": [
            {
                "text": "O amor não se manifesta no desejo de fazer amor — isso pode ser simples desejo — mas no desejo de dormir ao lado de alguém.",
                "difficulty": 3,
            },
            {
                "text": "A leveza e o peso: eis o dilema da nossa existência. Viver é uma queda, e cada escolha é uma pedra jogada em um lago sem fundo.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "Cidade de Deus",
        "author": "Paulo Lins",
        "year": 1997,
        "language": "pt",
        "passages": [
            {
                "text": "A favela não é só violência. É também amor, é família, é futebol de domingo, é funk no baile. É uma cidade dentro da cidade, invisível para os que não querem ver.",
                "difficulty": 3,
            },
        ],
    },
    # ── FICÇÃO BRASILEIRA MODERNA ─────────────────────────────────────────────
    {
        "title": "O Auto da Compadecida",
        "author": "Ariano Suassuna",
        "year": 1955,
        "language": "pt",
        "passages": [
            {
                "text": "No sertão, a seca mata o gado, mas não mata a fé. O homem nordestino carrega nas costas o peso do sol e nos olhos a luz que não se apaga.",
                "difficulty": 3,
            },
            {
                "text": "João Grilo sempre teve jeito para virar situação ao seu favor. É o talento do pobre: quando não tem nada, usa a inteligência.",
                "difficulty": 3,
            },
        ],
    },
    {
        "title": "Quarto de Despejo",
        "author": "Carolina Maria de Jesus",
        "year": 1960,
        "language": "pt",
        "passages": [
            {
                "text": "Hoje acordei com o espírito perturbado. Será que Deus sabe que existem pobres? E que o pobre come o que acha no lixo?",
                "difficulty": 3,
            },
            {
                "text": "Eu classifico São Paulo assim: o Palácio é a sala de visita. A Prefeitura é a sala de jantar e a cidade é o jardim. E a favela é o quintal onde jogam os lixos.",
                "difficulty": 4,
            },
        ],
    },
    # ── AVENTURA & AÇÃO CLÁSSICA ──────────────────────────────────────────────
    {
        "title": "Vinte Mil Léguas Submarinas",
        "author": "Júlio Verne",
        "year": 1870,
        "language": "fr",
        "passages": [
            {
                "text": "O mar é tudo. Ele cobre sete décimos do globo terrestre. Sua respiração é pura e sadia. É o imenso deserto onde o homem nunca está só, pois sente a vida fremindo em torno dele.",
                "difficulty": 3,
            },
            {
                "text": "O Capitão Nemo não pertencia à humanidade. Ele era um homem que havia rompido todos os laços com o mundo da superfície — e nesse isolamento encontrou uma liberdade absoluta.",
                "difficulty": 4,
            },
        ],
    },
    {
        "title": "A Volta ao Mundo em 80 Dias",
        "author": "Júlio Verne",
        "year": 1872,
        "language": "fr",
        "passages": [
            {
                "text": "Phileas Fogg não era um viajante comum. Era um homem de rotina absoluta que decidiu, por uma aposta absurda, virar o mundo de cabeça para baixo.",
                "difficulty": 2,
            },
        ],
    },
    {
        "title": "Treasure Island",
        "author": "Robert Louis Stevenson",
        "year": 1883,
        "language": "en",
        "passages": [
            {
                "text": "Era o mapa que mudou tudo. Um simples pedaço de papel manchado de rum e sangue, com um X marcado numa ilha que ninguém sabia onde ficava.",
                "difficulty": 2,
            },
        ],
    },
    # ── FANTASIA URBANA & VAMPIROS MODERNOS ───────────────────────────────────
    {
        "title": "Entrevista com o Vampiro",
        "author": "Anne Rice",
        "year": 1976,
        "language": "en",
        "passages": [
            {
                "text": "A imortalidade não é um presente. É uma condenação para quem não consegue esquecer. Louis carregava cada morte, cada perda, com o peso de séculos.",
                "difficulty": 4,
            },
            {
                "text": "Lestat não tinha pena. Lestat tinha sede. E a diferença entre um monstro e um homem, percebi, era exatamente isso.",
                "difficulty": 3,
            },
        ],
    },
]


def run():
    db = SessionLocal()
    try:
        # Limpa dados antigos para garantir um estado consistente e atualizado
        db.query(DailyChallenge).delete()
        db.query(Passage).delete()
        db.query(Book).delete()
        db.commit()
        print("Dados anteriores limpos com sucesso.")

        all_passages = []
        for book_data in BOOKS:
            # Skip duplicates (books listed twice)
            if not book_data["passages"]:
                continue

            book = Book(
                title=book_data["title"],
                author=book_data["author"],
                year=book_data["year"],
                language=book_data["language"],
            )
            db.add(book)
            db.flush()

            for p in book_data["passages"]:
                passage = Passage(
                    book_id=book.id,
                    text=p["text"],
                    difficulty=p["difficulty"],
                )
                db.add(passage)
                db.flush()
                all_passages.append(passage)

            print(f"  Livro: {book.title} ({len(book_data['passages'])} trechos)")

        db.commit()
        print(f"\nTotal: {db.query(Book).count()} livros, {len(all_passages)} trechos criados.\n")

        passages = db.query(Passage).all()
        today = get_local_date()
        created = 0

        # Create challenges from 30 days ago to 30 days in the future
        for i in range(-30, 31):
            challenge_date = today + timedelta(days=i)
            # Find a distinct passage for each day using modulo to loop over available passages
            passage_index = (i + 30) % len(passages)
            passage = passages[passage_index]

            exists = db.query(DailyChallenge).filter(DailyChallenge.date == challenge_date).first()
            if not exists:
                challenge = DailyChallenge(passage_id=passage.id, date=challenge_date)
                db.add(challenge)
                created += 1
                label = "HOJE" if challenge_date == today else str(challenge_date)
                print(f"  Desafio {label}: '{passage.book.title}' (dif. {passage.difficulty})")

        db.commit()
        print(f"\n{created} desafio(s) criado(s).")

        print(f"\nResumo do banco:")
        print(f"  Livros: {db.query(Book).count()}")
        print(f"  Trechos: {db.query(Passage).count()}")
        print(f"  Desafios: {db.query(DailyChallenge).count()}")

    finally:
        db.close()


if __name__ == "__main__":
    run()
