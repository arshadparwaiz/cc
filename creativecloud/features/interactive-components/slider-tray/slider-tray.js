/* eslint-disable no-case-declarations */
/* eslint-disable no-use-before-define */
import { createTag } from '../../../scripts/utils.js';
import defineDeviceByScreenSize from '../../../scripts/decorate.js';

export default async function stepInit(data) {
  const layer = createTag('div', { class: `layer layer-${data.stepIndex}` });
  await createSelectorTray(data, layer);
  sliderEvent(data.target, layer);
  uploadImage(data.target, layer);
  return layer;
}

async function createSelectorTray(data, layer) {
  const sliderTray = createTag('div', { class: 'sliderTray' });
  const menu = createTag('div', { class: 'menu' });
  const config = data.stepConfigs[data.stepIndex];
  const options = config.querySelectorAll(':scope > div .icon');
  [...options].forEach((o) => { handleInput(o, sliderTray, menu, layer); });
  layer.append(sliderTray);
  observeSliderTray(sliderTray, data.target, menu);
}

function handleInput(option, sliderTray, menu, layer) {
  let inputType = option.classList[1].split('icon-')[1];
  const sliderType = inputType.split('-')[0];
  if (inputType.includes('slider')) inputType = 'slider';
  const sibling = option.nextSibling;
  const text = sibling.nodeValue.trim();
  let picture = '';
  if (sibling.nextSibling && sibling.nextSibling.tagName === 'PICTURE') {
    picture = sibling.nextSibling;
  }
  switch (inputType) {
    case 'slider':
      createSlider(sliderType, text, menu, sliderTray);
      break;
    case 'upload':
      createUploadButton(text, picture, sliderTray, menu);
      break;
    case 'upload-ps':
      createUploadPSButton(text, picture, layer);
      break;
    default:
      window.lana.log(`Unknown input type: ${inputType}`);
      break;
  }
}

function observeSliderTray(sliderTray, targets) {
  const options = { threshold: 0.7 };
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const menu = sliderTray.querySelector('.menu');
      const outerCircle = menu.querySelector('.outerCircle');
      outerCircle.classList.add('showOuterBorder');
      setTimeout(() => { animateSlider(menu, targets); }, 800);
      observer.unobserve(entry.target);
    });
  }, options);
  io.observe(sliderTray);
}

function createSlider(sliderType, details, menu, sliderTray) {
  const [label, min, max] = details.split('|').map((item) => item.trim());
  const sliderLabel = createTag('label', { for: `${sliderType}` }, label);
  const sliderContainer = createTag('div', { class: `sliderContainer ${sliderType.toLowerCase()}` });
  const outerCircle = createTag('a', { class: 'outerCircle', href: '#', tabindex: '-1' });
  const analyticsHolder = createTag('div', { class: 'interactive-link-analytics-text' }, `Adjust ${sliderType} slider`);
  const input = createTag('input', {
    type: 'range',
    min,
    max,
    class: `options ${sliderType.toLowerCase()}-input`,
    value: `${sliderType === 'hue' ? '0' : '180'}`,
  });
  outerCircle.append(analyticsHolder);
  sliderContainer.append(input, outerCircle);
  menu.append(sliderLabel, sliderContainer);
  sliderTray.append(menu);
  outerCircle.addEventListener('click', (e) => {
    e.preventDefault();
  });
  applyAccessibility(input, outerCircle);
}

function createUploadButton(details, picture, sliderTray, menu) {
  const currentVP = defineDeviceByScreenSize().toLocaleLowerCase();
  const btn = createTag('input', { class: 'inputFile', type: 'file', accept: 'image/*' });
  const labelBtn = createTag('a', { class: `uploadButton body-${currentVP === 'mobile' ? 'm' : 'xl'}` }, details);
  const analyticsHolder = createTag('div', { class: 'interactive-link-analytics-text' }, `${details}`);
  labelBtn.append(btn, analyticsHolder);
  appendSVGToButton(picture, labelBtn);
  const clone = labelBtn.cloneNode(true);
  clone.classList.add('uploadButtonMobile');
  menu.append(clone);
  sliderTray.append(labelBtn);
  applyAccessibility(btn, labelBtn);
}

function applyAccessibility(inputEle, target) {
  let tabbing = false;
  document.addEventListener('keydown', () => {
    tabbing = true;
    inputEle.addEventListener('focus', () => {
      if (tabbing) {
        target.classList.add('focusUploadButton');
      }
    });
    inputEle.addEventListener('blur', () => {
      target.classList.remove('focusUploadButton');
    });
  });
  document.addEventListener('keyup', () => {
    tabbing = false;
  });
}

function createUploadPSButton(details, picture, layer) {
  const btn = createTag('a', { class: 'continueButton body-xl hide' }, details);
  appendSVGToButton(picture, btn);
  layer.append(btn);
}

function appendSVGToButton(picture, button) {
  if (!picture) return;
  const svg = picture.querySelector('img[src*=svg]');
  if (!svg) return;
  const svgClone = svg.cloneNode(true);
  const svgCTACont = createTag('div', { class: 'svg-icon-container' });
  svgCTACont.append(svgClone);
  button.prepend(svgCTACont);
}

function sliderEvent(media, layer) {
  let hue = 0;
  let saturation = 100;
  ['hue', 'saturation'].forEach((sel) => {
    const sliderEl = layer.querySelector(`.${sel.toLowerCase()}-input`);
    sliderEl.addEventListener('input', () => {
      const image = media.querySelector('.interactive-holder picture > img');
      const { value } = sliderEl;
      const outerCircle = sliderEl.nextSibling;
      const rect = sliderEl.getBoundingClientRect();
      const value1 = (value - sliderEl.min) / (sliderEl.max - sliderEl.min);
      const thumbOffset = value1 * (rect.width - outerCircle.offsetWidth);
      const interactiveBlock = media.closest('.marquee') || media.closest('.aside');
      const isRowReversed = interactiveBlock.classList.contains('.row-reversed');
      if ((document.dir === 'rtl' || isRowReversed)) {
        outerCircle.style.right = `${thumbOffset + 8}px`;
      } else {
        outerCircle.style.left = `${thumbOffset + 8}px`;
      }
      switch (sel.toLowerCase()) {
        case ('hue'):
          hue = value;
          break;
        case ('saturation'):
          saturation = value;
          break;
        default:
          break;
      }
      image.style.filter = `hue-rotate(${hue}deg) saturate(${saturation}%)`;
    });
    sliderEl.addEventListener('change', () => {
      const outerCircle = sliderEl.nextSibling;
      outerCircle.click();
    });
  });
}

function uploadImage(media, layer) {
  layer.querySelectorAll('.uploadButton').forEach((btn) => {
    const analyticsBtn = btn.querySelector('.interactive-link-analytics-text');
    btn.addEventListener('cancel', () => {
      cancelAnalytics(btn);
    });
    btn.addEventListener('change', (event) => {
      const image = media.querySelector('picture > img');
      const file = event.target.files[0];
      if (file) {
        const sources = image.querySelectorAll('source');
        sources.forEach((source) => source.remove());
        const imageUrl = URL.createObjectURL(file);
        image.src = imageUrl;
        analyticsBtn.innerHTML = 'Upload Button';
        const continueBtn = layer.querySelector('.continueButton');
        if (continueBtn) {
          continueBtn.classList.remove('hide');
        }
      } else {
        cancelAnalytics(btn);
      }
    });
  });
}

function cancelAnalytics(btn) {
  const x = (e) => {
    e.preventDefault();
  };
  btn.addEventListener('click', x);
  const cancelEvent = new Event('click', { detail: { message: 'Cancel button clicked in file dialog' } });
  btn.setAttribute('daa-ll', 'Cancel Upload');
  btn.dispatchEvent(cancelEvent);
  btn.removeEventListener('click', x);
  btn.setAttribute('daa-ll', 'Upload Image');
}

function animateSlider(menu, target) {
  const option = menu.querySelector('.options');
  const aobj = { interrupted: false };
  const outerCircle = option.nextSibling;
  outerCircle.classList.add('animate');
  ['mousedown', 'touchstart'].forEach((e) => {
    option.closest('.sliderTray').addEventListener(e, () => {
      aobj.interrupted = true;
      outerCircle.classList.remove('showOuterBorder', 'animate', 'animateout');
    }, { once: true });
  });
  outerCircle.addEventListener('transitionend', () => {
    setTimeout(() => {
      const min = parseInt(option.min, 10);
      const max = parseInt(option.max, 10);
      const middle = (min + max) / 2;
      sliderScroll(option, middle, max, 1200, outerCircle, target, aobj);
    }, 500);
  }, { once: true });
}

function sliderScroll(slider, start, end, duration, outerCircle, target, aobj) {
  let current = start;
  let step = ((end - start) / duration) * 10;
  let direction = 1;
  function stepAnimation() {
    slider.value = current;
    current += step;
    if (aobj.interrupted) return;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    if ((step > 0 && current >= (start + 70)) || (step < 0 && current >= (start + 70))) {
      step = -step;
      setTimeout(stepAnimation, 10);
    } else if ((step > 0 && current <= (start - 70)) || (step < 0 && current <= (start - 70))) {
      step = -step;
      setTimeout(stepAnimation, 10);
      direction = -1;
    } else if (current === start && direction === -1) {
      slider.value = current;
      const image = target.querySelector('picture > img');
      image.style.filter = `hue-rotate(${0}deg)`;
      setTimeout(() => {
        outerCircle.classList.remove('animate');
        outerCircle.classList.add('animateout');
      }, 500);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      setTimeout(stepAnimation, 10);
    }
  }
  setTimeout(stepAnimation, 10);
}
