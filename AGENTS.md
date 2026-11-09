# Orca Russian language pack

Плагин языкового пакета для Orca: русская локализация интерфейса.
Не отдельное приложение и не форк Orca.

- Репозиторий: `git@github.com:kvdecvlt/orca-russian-language.git`
- Плагин: `kvdecvlt.russian-language`, locale `ru-RU`, manifest/API 1
- Лицензия MIT, переводы производны от каталога Orca (см. `NOTICE`)

## Состояние

- Последний релиз: `v1.2.0`, каталог сверен с Orca `1.4.251`.
- На этой машине стоит Orca `1.4.251` в `/opt/stably-orca`.
- Установленная копия плагина на момент обновления: `1.1.0`, её нужно переустановить на `1.2.0`.

## Структура

| Путь | Назначение |
| --- | --- |
| `locales/ru-RU.json` | единственный источник текста плагина |
| `orca-plugin.json` | манифест формата 2: id, версия, `execution: data`, `engines.orca`, путь к каталогу |
| `orca-marketplace.json` | запись маркетплейса, `source.ref` указывает на тег |
| `scripts/validate-language-pack.mjs` | валидатор манифеста и каталога |
| `README.md` | установка и заявленная версия Orca |
| `CONTRIBUTING.md` | правила перевода и лимиты |
| `.github/workflows/validate.yml` | CI, Node 22 |

Зависимостей нет, всё работает на встроенных модулях Node.

## Обновление под новую версию Orca

1. Узнать версию установленной Orca:

   ```sh
   grep -i X-AppImage-Version /opt/stably-orca/orca-ide.desktop
   ```

2. Найти актуальный русский каталог Orca:

   ```sh
   ls -t /opt/stably-orca/resources/app.asar.unpacked/out/renderer/assets/ru-*.json
   ```

   Файлов может быть несколько, свежий сверху. Имя содержит хеш и меняется при обновлении. В свежих сборках Orca есть собственный каталог `ru`, его удобно использовать как источник переводов новых ключей. Английский каталог отдельным файлом там не лежит, ищи формулировки в исходниках `stablyai/orca` или в собранном бандле.

3. Сравнить ключи плагина и каталога Orca:

   ```sh
   SRC=$(ls -t /opt/stably-orca/resources/app.asar.unpacked/out/renderer/assets/ru-*.json | head -1)
   node -e '
   const fs=require("fs");
   const leaves=(o,p="",s=new Set())=>{for(const k of Object.keys(o)){const v=o[k],q=p?p+"."+k:k;v&&typeof v==="object"&&!Array.isArray(v)?leaves(v,q,s):s.add(q)}return s};
   const A=leaves(JSON.parse(fs.readFileSync("locales/ru-RU.json","utf8")));
   const B=leaves(JSON.parse(fs.readFileSync(process.argv[1],"utf8")));
   console.log("плагин:",A.size,"orca:",B.size);
   console.log("нет в плагине:",[...B].filter(k=>!A.has(k)).length);
   console.log("нет в orca:",[...A].filter(k=>!B.has(k)).length);
   ' "$SRC"
   ```

4. Каталог Orca можно взять за основу, но не копировать слепо. Orca отбрасывает защищённые строки, ограничивает длину и требует покрытие не меньше 80%. Сначала выкинуть ключи, которых больше нет в Orca, затем переносить новые.

5. Переводить только значения. Ключи и структуру не менять. Плейсхолдеры вида `{{value0}}` сохранять вместе с порядком и цифрами.

6. Проверить и установить локально:

   ```sh
   node scripts/validate-language-pack.mjs
   ```

7. Поднять версии и подготовить релиз (см. «Релиз»).

## Правила перевода

Кратко, полные правила в `CONTRIBUTING.md`.

- Только значения, ключи не трогать.
- Не переводить код, команды, флаги, пути, URL, имена клавиш, названия IDE, провайдеров и моделей.
- Оставлять на английском: `Orca`, `worktree`, `workspace`, `repo`, `branch`, `commit`, `diff`, `merge`, `PR`, `MR`, `issue`, `agent`, `terminal`, `prompt`, `token`, `SSH`, `WSL`, `VM`, `Docker`, `CI`, `GitHub`, `GitLab`, `Linear`, `Slack`.
- Названия языков в селекторе - эндонимы: `English`, `中文（简体）`, `한국어`, `日本語`, `Español`, `Français`. Переводится только `System` → «Системный».
- Кнопки - императив («Сохранить»), настройки - существительными.
- Естественный короткий UI-русский, без длинных пояснений.

## Лимиты

Правила Orca `1.4.251`:

- не больше 50000 записей, считаются все ключи, включая родительские объекты;
- глубина не больше 16;
- значение не длиннее 8192 символов и не длиннее 4 длин английского текста, но не меньше 64 символов;
- ключ длиной 1..128, без точек и управляющих символов;
- нельзя переопределять защищённые строки: `protected-copy-keys.json` в Orca (1001 ключ) и строки управления плагинами `auto.components.settings.*plugin*`, кроме белого списка;
- плагин должен покрывать не меньше 80% строк английского каталога. Ниже порога Orca оставляет плагин установленным, но не даёт выбрать его языком интерфейса, поэтому UI остаётся на английском.

Старый лимит 20000 записей в Orca `1.4.251` уже не действует. Проверять каталог лучше валидатором Orca из `/opt/stably-orca/resources/app.asar.unpacked/out/shared/plugins/`, репозиторный валидатор обновлён под 50000 записей.

Фактические цифры для Orca `1.4.251`:

- плагин `1.1.0`: 14642 листа, 16481 запись, покрытие ниже 80%;
- каталог Orca: 19149 листьев, 21560 записей;
- после фильтра защищённых строк и слияния: 17797 листьев, 20161 запись;
- покрытие объединённого каталога относительно встроенных локалей Orca: около 92%.

Каталог Orca нельзя копировать без фильтра: в нём есть защищённые строки, а часть значений не проходит ограничения длины.

## Проверка в Orca

- Для правок до релиза: Settings → Plugins → Development → путь к корню плагина (папка с `orca-plugin.json`) → Add path.
- Включить плагин, затем Settings → Appearance → Language → `ru-RU` от `kvdecvlt.russian-language`.
- Полностью перезапустить Orca.
- Установленная копия в `~/.config/orca/plugins/` не связана с рабочей папкой: правки в репозитории туда сами не попадают.
- `~/.config/orca/plugins/kvdecvlt.russian-language/current` - это файл с хешем, а не каталог.
- Быстрая проверка папки без UI: `/opt/stably-orca/resources/bin/orca-ide plugin validate .`.
- Для установки из Git нужен `manifestVersion: 2`. Проверка релиза: `/opt/stably-orca/resources/bin/orca-ide plugin release-entry .` должен вернуть `ok: true`.
- Проверка релизной установки: Settings → Plugins → Install → Git URL с тегом.

## Релиз

1. Поднять `version` в `orca-plugin.json` (semver `x.y.z`).
2. Проверить `engines.orca`, при необходимости поднять минимальную версию.
3. Обновить `source.ref` в `orca-marketplace.json` на новый тег.
4. Обновить версию Orca и команду установки в `README.md`.
5. Прогнать `node scripts/validate-language-pack.mjs` и `orca-ide plugin validate .`.
6. Проверить `orca-ide plugin release-entry .`: должен вернуть `ok: true` с версией, коммитом и `contentHash`.
7. Поставить тег `vX.Y.Z` и запушить его.

Коммиты и теги создавать только по явной просьбе. Сообщения короткие, по-русски, без conventional commits.
