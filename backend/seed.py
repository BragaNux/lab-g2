"""Popula o banco com livros, trechos e desafios para teste."""
from datetime import date, timedelta
from app.database import SessionLocal
from app.models.book import Book
from app.models.passage import Passage, DailyChallenge
import app.models  # noqa: registra todos os models
from app.utils import get_local_date

BOOKS = [
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
                "text": "Numma manhã, ao despertar de sonhos inquietos, Gregor Samsa deu por si na cama transformado num gigantesco inseto.",
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
        print(f"\nTotal: {len(BOOKS)} livros, {len(all_passages)} trechos criados.\n")

        passages = db.query(Passage).all()
        today = get_local_date()
        created = 0

        # Create challenges from 15 days ago to 15 days in the future
        for i in range(-15, 16):
            challenge_date = today + timedelta(days=i)
            # Find a distinct passage for each day using modulo to loop over available passages
            passage_index = (i + 15) % len(passages)
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
