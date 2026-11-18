# Сторонние компоненты

Подключаются на сайт только из этого списка. Новый компонент вносится сюда до подключения.

| Компонент | Где | Лицензия | Источник |
|---|---|---|---|
| IBM Plex Sans (wght, cyrillic + latin) | основной текст | SIL Open Font License 1.1 | github.com/IBM/plex, файлы через Fontsource |
| IBM Plex Mono 400/500/600 | данные: id, хеши, даты, команды | SIL OFL 1.1 | github.com/IBM/plex, через Fontsource |
| «Репер» Regular | заголовки, цифры, логотип; на сайте `site/fonts/Reper-Regular.woff2` | своя, нарисована для проекта (исходник `saiti/kit/type/reper_src`, сборка `saiti/kit/type/out/reper/`) | — |

Только в пробных плитках (`design/tiles/fonts/`), на сайт не идут: PT Sans Narrow 700, Wix Madefor Text, Jura, Fira Sans, Fira Mono, Dela Gothic One. Все OFL 1.1.

Рисунки (`site/img/*.svg`, OG, фавиконы) нарисованы для проекта в Illustrator: исходник `design/illo/draw.jsx`, обработка `design/illo/post.py`. Анимации написаны на CSS и обычном JS, библиотек нет.

Не используются:
- GSAP — ждёт решения z1nex по лицензии;
- логотип, слоган и вёрстка ПАО «МегаФон».

Цитаты источников приводятся с URL и датой снятия в реестре страницы (`#registry`).
