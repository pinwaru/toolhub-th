const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');

// อัปเดตตัวนับจำนวนตัวอักษรและคำ
inputText.addEventListener('input', () => {
  const text = inputText.value;
  charCount.textContent = text.length;
  
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  wordCount.textContent = text.trim() === '' ? 0 : words.length;
});

// ฟังก์ชันแปลงเคสรูปแบบต่างๆ
function convertCase(type) {
  let text = inputText.value;
  if (!text) return;

  switch (type) {
    case 'upper':
      inputText.value = text.toUpperCase();
      break;
    case 'lower':
      inputText.value = text.toLowerCase();
      break;
    case 'title':
      inputText.value = text.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
      break;
    case 'capital':
      inputText.value = text.toLowerCase().replace(/(^\w|\.\s*\w)/g, match => match.toUpperCase());
      break;
    case 'camel':
      inputText.value = text.toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
      break;
    case 'kebab':
      inputText.value = text.toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      break;
    case 'snake':
      inputText.value = text.toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      break;
  }
}

// ฟังก์ชันคัดลอกข้อความ
function copyText() {
  if (!inputText.value) return;
  inputText.select();
  navigator.clipboard.writeText(inputText.value);
  alert('คัดลอกข้อความเรียบร้อยแล้ว!');
}

// ฟังก์ชันล้างข้อความ
function clearText() {
  inputText.value = '';
  charCount.textContent = '0';
  wordCount.textContent = '0';
}
