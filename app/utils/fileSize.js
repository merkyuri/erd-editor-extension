function getByteCountByContent(s = "") {
  let count = 0,
    stringLength = s.length,
    i;
  s = String(s || "");

  for (i = 0; i < stringLength; i++) {
    const partCount = encodeURI(s[i]).split("%").length;
    count += partCount === 1 ? 1 : partCount - 1;
  }

  return count;
}

function fileSize(size = 0) {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  const numberPart = +(size / Math.pow(1024, i)).toFixed(2) * 1;
  const stringPart = ["B", "kB", "MB", "GB", "TB"][i];

  return `${numberPart} ${stringPart}`;
}

export { getByteCountByContent, fileSize };
