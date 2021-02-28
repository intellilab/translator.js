import { provider as youdaoProvider } from './youdao';
import { provider as bingProvider } from './bing';
import { provider as googleProvider } from './google';
import styles, { stylesheet } from './style.module.css';

GM_addStyle(stylesheet);
const React = VM;
let audio;
let mouse;
let query;
let hoverTimer;

const panel = VM.getPanel({ shadow: false });
const button = VM.getHostElement(false);
button.root.className = styles.buttonRoot;
button.root.append((
  <div className={styles.button} onMouseOver={handlePrepare} onMouseOut={handleCancel} />
));

function play(url) {
  if (!audio) audio = <audio autoPlay />;
  audio.src = url;
}

function getPlayer(url) {
  return () => {
    play(url);
  };
}

function handleOpenUrl(e) {
  const { href } = e.target.dataset;
  const a = <a href={href} target="_blank" rel="noopener noreferrer" />;
  a.click();
}

function handleTranslate() {
  hoverTimer = null;
  button.hide();
  translate();
}

function handlePrepare() {
  if (!hoverTimer) {
    hoverTimer = setTimeout(handleTranslate, 800);
  }
}

function handleCancel() {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

function render(results) {
  panel.clear();
  for (const [name, result] of Object.entries(results)) {
    const {
      query: q, phonetic, detailUrl, explains, translations,
    } = result;
    panel.append((
      <panel.id className={styles.section}>
        <panel.id className={styles.label}>{name}</panel.id>
        <panel.id className={styles.content}>
          {!!(q || phonetic?.length) && (
            <panel.id className={styles.block}>
              {q && <panel.id>{q}</panel.id>}
              {phonetic?.map(({ html, url }) => (
                <panel.id
                  className={`${styles.phonetic} ${styles.link}`}
                  dangerouslySetInnerHTML={{ __html: html }}
                  onClick={getPlayer(url)}
                />
              ))}
            </panel.id>
          )}
          {explains && (
            <panel.id className={styles.block}>
              {explains.map(item => (
                <panel.id className={styles.item} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </panel.id>
          )}
          {detailUrl && (
            <panel.id className={styles.block}>
              <panel.id className={styles.link} data-href={detailUrl} onClick={handleOpenUrl}>
                更多...
              </panel.id>
            </panel.id>
          )}
          {translations && (
            <panel.id className={styles.block}>
              {translations.map(item => (
                <panel.id className={styles.item} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </panel.id>
          )}
        </panel.id>
      </panel.id>
    ));
  }
  const { wrapper } = panel;
  Object.assign(wrapper.style, getPosition());
  panel.show();
}

function getPosition() {
  const { innerWidth, innerHeight } = window;
  const { clientX, clientY } = mouse;
  const style = {};
  if (clientY > innerHeight * 0.5) {
    style.top = 'auto';
    style.bottom = `${innerHeight - clientY + 10}px`;
  } else {
    style.top = `${clientY + 10}px`;
    style.bottom = 'auto';
  }
  if (clientX > innerWidth * 0.5) {
    style.left = 'auto';
    style.right = `${innerWidth - clientX}px`;
  } else {
    style.left = `${clientX}px`;
    style.right = 'auto';
  }
  return style;
}

const providers = [
  youdaoProvider,
  bingProvider,
  googleProvider,
];

function getSelectionText() {
  const { activeElement } = document;
  let text;
  if (['input', 'textarea'].includes(activeElement.tagName.toLowerCase())) {
    text = activeElement.value.slice(activeElement.selectionStart, activeElement.selectionEnd);
  } else {
    const sel = window.getSelection();
    text = sel.toString();
  }
  return text.trim();
}

let session;
function translate() {
  const results = {};
  session = results;
  providers.forEach(async provider => {
    const result = await provider.handle(query);
    if (!result || session !== results) return;
    results[provider.name] = result;
    render(results);
  });
}

function debounce(func, delay) {
  let timer;
  function exec(...args) {
    timer = null;
    func(...args);
  }
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(exec, delay, ...args);
  };
}

function initialize() {
  const panelStyle = panel.body.style;
  panelStyle.maxHeight = '50vh';
  panelStyle.padding = '0 8px';
  panelStyle.overflow = 'auto';
  panelStyle.overscrollBehavior = 'contain';
  const debouncedTranslate = debounce(event => {
    mouse = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    query = getSelectionText();
    if (/^\s*$/.test(query)) return;
    Object.assign(button.root.style, getPosition());
    button.show();
  });
  document.addEventListener('mousedown', (e) => {
    if (panel.body.contains(e.target)) return;
    panel.hide();
    button.hide();
    session = null;
  }, true);
  document.addEventListener('mouseup', (e) => {
    if (panel.body.contains(e.target)) return;
    debouncedTranslate(e);
  }, true);
}

initialize();
