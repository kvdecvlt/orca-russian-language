# orca-russian-language

Русская локализация интерфейса [Orca](https://github.com/stablyai/orca) как плагин языка.
Покрывает практически весь UI: меню, трей, настройки, панели, диалоги.

Актуально для Orca **1.4.218**: ключи сверены с официальным каталогом `en.json` этой версии.

## Установка

1. Settings → Plugins → Install → вкладка **Git URL**:
   `https://github.com/kvdecvlt/orca-russian-language.git#v1.1.0`
2. Подтверди consent-диалог.
3. Settings → Appearance → Language → выбери `ru-RU — kvdecvlt.russian-language`.
4. Полностью перезапусти Orca.

Тег фиксирует проверенную версию. Если нужен всегда последний `main` — замени
`#v1.1.0` на `#main`.

## Установка из локальной папки

Для проверки правок до релиза:

1. Settings → Plugins → **Development** → в поле пути укажи корень плагина
   (папка с `orca-plugin.json`) → **Add path**.
   Вариант через обычную установку: Settings → Plugins → **Install** → вкладка
   **Local folder** с тем же путём (Orca скопирует плагин, правки в папке после
   этого не подхватятся).
2. Подтверди consent и включи плагин.
3. Settings → Appearance → Language → выбери `ru-RU — kvdecvlt.russian-language`.
4. Полностью перезапусти Orca.
