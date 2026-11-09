# orca-russian-language

Русская локализация интерфейса [Orca](https://github.com/stablyai/orca) как плагин языка.
Покрывает практически весь UI: меню, трей, настройки, панели, диалоги.

Актуально для Orca **1.4.251**: ключи сверены с каталогом этой версии. Каталог плагина покрывает больше 80% строк интерфейса, иначе Orca не даёт выбрать язык.

## Установка

1. Settings → Plugins → Install → вкладка **Git URL**:
   `https://github.com/kvdecvlt/orca-russian-language.git#v1.2.0`
2. Подтверди consent-диалог.
3. Settings → Appearance → Language → выбери `ru-RU` (`kvdecvlt.russian-language`).
4. Полностью перезапусти Orca.

Тег фиксирует проверенную версию. Если нужен всегда последний `main`, замени
`#v1.2.0` на `#main`.

## Установка из локальной папки

Для проверки правок до релиза:

1. Settings → Plugins → **Development** → в поле пути укажи корень плагина
   (папка с `orca-plugin.json`) → **Add path**.
2. Подтверди consent и включи плагин.
3. Settings → Appearance → Language → выбери `ru-RU` (`kvdecvlt.russian-language`).
4. Полностью перезапусти Orca.
