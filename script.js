const listContainer = document.getElementById("pdf-list");
const pageUpdated = document.getElementById("page-updated");

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// 将来的にカテゴリ表示を追加しやすいよう、一覧の生成処理を小さな関数に分けています。
async function loadPdfList() {
  try {
    const response = await fetch("pdf-list.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`pdf-list.json の読み込みに失敗しました。HTTP ${response.status}`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) {
      throw new Error("pdf-list.json の形式が正しくありません。");
    }

    renderPdfList(items);
    renderLatestUpdated(items);
  } catch (error) {
    renderError(error);
  }
}

function renderPdfList(items) {
  listContainer.textContent = "";

  if (items.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "loading";
    emptyMessage.textContent = "現在、掲載中のPDF項目はありません。";
    listContainer.append(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    fragment.append(createPdfItem(normalizeItem(item)));
  });
  listContainer.append(fragment);
}

function createPdfItem(item) {
  const article = document.createElement("article");
  article.className = "pdf-item";

  const fileName = normalizeFileName(item.file);
  const href = `pdf/${encodeURIComponent(fileName)}`;
  const thumbnailName = item.thumbnail || thumbnailNameFromPdf(fileName);

  const link = document.createElement("a");
  link.className = "pdf-card";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", `${item.title}を開く`);

  const thumbnail = document.createElement("div");
  thumbnail.className = "pdf-thumb";
  thumbnail.append(createThumbnailImage(thumbnailName, item.title));

  const content = document.createElement("div");
  content.className = "pdf-content";

  const title = document.createElement("h3");
  title.className = "pdf-title";
  title.textContent = item.title;
  content.append(title);

  if (item.description) {
    const description = document.createElement("p");
    description.className = "pdf-description";
    description.textContent = item.description;
    content.append(description);
  }

  if (item.updated) {
    const meta = document.createElement("p");
    meta.className = "pdf-meta";
    meta.textContent = `最終更新日：${formatDate(item.updated)}`;
    content.append(meta);
  }

  const printLink = document.createElement("span");
  printLink.className = "pdf-link-print";
  printLink.textContent = href;
  content.append(printLink);

  link.append(thumbnail, content);
  article.append(link);
  return article;
}

function renderLatestUpdated(items) {
  const timestamps = items
    .map((item) => Date.parse(normalizeItem(item).updated))
    .filter((timestamp) => Number.isFinite(timestamp));

  if (timestamps.length === 0) {
    pageUpdated.textContent = "";
    return;
  }

  const latest = new Date(Math.max(...timestamps));
  pageUpdated.textContent = `ページ最終更新：${dateFormatter.format(latest)}`;
}

function renderError(error) {
  listContainer.textContent = "";

  const message = document.createElement("section");
  message.className = "message-box";
  message.setAttribute("role", "alert");

  const title = document.createElement("h2");
  title.textContent = "PDF一覧を読み込めませんでした";

  const description = document.createElement("p");
  description.textContent =
    "GitHub Pagesなどの公開URL、またはローカルサーバー経由でページを開いてください。";

  const detail = document.createElement("p");
  detail.className = "pdf-meta";
  detail.textContent = error.message;

  message.append(title, description, detail);
  listContainer.append(message);
}

function normalizeItem(item) {
  if (typeof item === "string") {
    const file = normalizeFileName(item);
    return {
      file,
      title: fileNameToTitle(file),
      description: "",
      updated: "",
    };
  }

  const file = normalizeFileName(item.file);
  return {
    file,
    title: item.title || fileNameToTitle(file),
    description: item.description || "",
    thumbnail: item.thumbnail || "",
    updated: item.updated || "",
  };
}

function normalizeFileName(fileName) {
  if (typeof fileName !== "string" || fileName.trim() === "") {
    return "";
  }

  return fileName.replace(/^\/+/, "").replace(/^pdf\//, "");
}

function fileNameToTitle(fileName) {
  return decodeURIComponent(fileName)
    .replace(/\.pdf$/i, "")
    .replace(/^\d+\s*[.．]\s*/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "無題の掲示事項";
}

function thumbnailNameFromPdf(fileName) {
  return fileName.replace(/\.pdf$/i, ".jpg");
}

function createThumbnailImage(thumbnailName, title) {
  const picture = document.createElement("picture");
  const fallback = createPdfLabel();
  const image = document.createElement("img");

  image.className = "pdf-thumbnail-image";
  image.src = `thumb/${encodeURIComponent(thumbnailName)}`;
  image.alt = `${title}のサムネイル`;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("error", () => {
    if (image.dataset.fallbackTried !== "true") {
      image.dataset.fallbackTried = "true";
      image.src = image.src.replace(/\.jpg(?:\?.*)?$/i, ".png");
      return;
    }

    picture.replaceWith(fallback);
  });

  picture.append(image);
  return picture;
}

function createPdfLabel() {
  const label = document.createElement("span");
  label.className = "pdf-label";
  label.textContent = "PDF";
  label.setAttribute("aria-hidden", "true");
  return label;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

loadPdfList();
