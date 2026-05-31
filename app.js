(function () {
  const templateGroups = [
    {
      title: "横向拼接",
      templates: [
        { rows: 1, cols: 2 },
        { rows: 1, cols: 3 },
        { rows: 1, cols: 4 },
        { rows: 1, cols: 5 },
      ],
    },
    {
      title: "纵向拼接",
      templates: [
        { rows: 2, cols: 1 },
        { rows: 3, cols: 1 },
        { rows: 4, cols: 1 },
        { rows: 5, cols: 1 },
      ],
    },
    {
      title: "宫格拼接",
      templates: [
        { rows: 2, cols: 2 },
        { rows: 2, cols: 3 },
        { rows: 2, cols: 4 },
        { rows: 2, cols: 5 },
        { rows: 3, cols: 2 },
        { rows: 3, cols: 3 },
        { rows: 3, cols: 4 },
        { rows: 3, cols: 5 },
      ],
    },
  ];

  const state = {
    rows: 1,
    cols: 2,
    fit: "cover",
    gap: 0,
    images: [],
  };

  const exportConfig = {
    fallbackRowHeight: 640,
    naturalColWidth: 900,
    gridCellWidth: 420,
    gridCellHeight: 420,
    emptyRatio: 4 / 3,
  };

  const templateGroupsEl = document.querySelector("#templateGroups");
  const uploadGrid = document.querySelector("#uploadGrid");
  const uploadTitle = document.querySelector("#uploadTitle");
  const filledCount = document.querySelector("#filledCount");
  const canvasSize = document.querySelector("#canvasSize");
  const canvas = document.querySelector("#previewCanvas");
  const ctx = canvas.getContext("2d");
  const gridFit = document.querySelector("#gridFit");
  const gapSize = document.querySelector("#gapSize");
  const gapOutput = document.querySelector("#gapOutput");
  const downloadBtn = document.querySelector("#downloadBtn");
  const clearAll = document.querySelector("#clearAll");

  function templateLabel(rows, cols) {
    return `${rows} x ${cols}`;
  }

  function cellCount() {
    return state.rows * state.cols;
  }

  function ensureImageSlots() {
    const nextCount = cellCount();
    state.images = state.images.slice(0, nextCount);
    while (state.images.length < nextCount) {
      state.images.push(null);
    }
  }

  function renderTemplates() {
    templateGroupsEl.innerHTML = "";

    templateGroups.forEach((group) => {
      const groupEl = document.createElement("div");
      groupEl.className = "template-group";

      const title = document.createElement("h3");
      title.textContent = group.title;

      const options = document.createElement("div");
      options.className = "template-options";

      group.templates.forEach((template) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "template-button";
        button.textContent = templateLabel(template.rows, template.cols);
        button.dataset.rows = template.rows;
        button.dataset.cols = template.cols;
        if (template.rows === state.rows && template.cols === state.cols) {
          button.classList.add("is-active");
        }
        button.addEventListener("click", () => {
          state.rows = template.rows;
          state.cols = template.cols;
          ensureImageSlots();
          render();
        });
        options.appendChild(button);
      });

      groupEl.append(title, options);
      templateGroupsEl.appendChild(groupEl);
    });
  }

  function renderUploadGrid() {
    uploadGrid.innerHTML = "";
    uploadGrid.style.setProperty("--upload-cols", state.cols);
    uploadTitle.textContent = `${state.rows} 行 x ${state.cols} 列`;

    state.images.forEach((imageData, index) => {
      const cell = document.createElement("label");
      cell.className = `upload-cell${imageData ? " has-image" : ""}`;

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
          loadImageFile(file, index);
        }
        input.value = "";
      });

      if (imageData) {
        const img = document.createElement("img");
        img.src = imageData.src;
        img.alt = imageData.name;
        cell.appendChild(img);
      } else {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `<strong>图片 ${index + 1}</strong><span>点击或拖入图片</span>`;
        cell.appendChild(empty);
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `删除图片 ${index + 1}`);
      remove.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.images[index] = null;
        render();
      });

      cell.addEventListener("dragover", (event) => {
        event.preventDefault();
        cell.classList.add("is-dragging");
      });
      cell.addEventListener("dragleave", () => {
        cell.classList.remove("is-dragging");
      });
      cell.addEventListener("drop", (event) => {
        event.preventDefault();
        cell.classList.remove("is-dragging");
        const file = Array.from(event.dataTransfer.files).find((item) =>
          item.type.startsWith("image/")
        );
        if (file) {
          loadImageFile(file, index);
        }
      });

      cell.append(remove, input);
      uploadGrid.appendChild(cell);
    });

    const filled = state.images.filter(Boolean).length;
    filledCount.textContent = `${filled} / ${cellCount()}`;
  }

  function loadImageFile(file, index) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const img = new Image();
      img.addEventListener("load", () => {
        state.images[index] = {
          name: file.name,
          src: reader.result,
          image: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        render();
      });
      img.src = reader.result;
    });
    reader.readAsDataURL(file);
  }

  function getRowTargetHeight() {
    const uploadedHeights = state.images
      .filter(Boolean)
      .map((imageData) => imageData.height);
    return uploadedHeights.length
      ? Math.min(...uploadedHeights)
      : exportConfig.fallbackRowHeight;
  }

  function dimensionsForImage(imageData, mode, targetSize) {
    if (!imageData) {
      if (mode === "row") {
        return {
          width: Math.round(targetSize * exportConfig.emptyRatio),
          height: targetSize,
        };
      }
      return {
        width: exportConfig.naturalColWidth,
        height: Math.round(exportConfig.naturalColWidth / exportConfig.emptyRatio),
      };
    }

    if (mode === "row") {
      return {
        width: Math.round(
          (imageData.width * targetSize) / imageData.height
        ),
        height: targetSize,
      };
    }

    return {
      width: exportConfig.naturalColWidth,
      height: Math.round(
        (imageData.height * exportConfig.naturalColWidth) / imageData.width
      ),
    };
  }

  function computeCanvasSize() {
    const gap = state.gap;
    if (state.rows === 1) {
      const targetHeight = getRowTargetHeight();
      const parts = state.images.map((item) =>
        dimensionsForImage(item, "row", targetHeight)
      );
      return {
        width:
          parts.reduce((sum, item) => sum + item.width, 0) +
          Math.max(0, parts.length - 1) * gap,
        height: targetHeight,
        parts,
      };
    }

    if (state.cols === 1) {
      const parts = state.images.map((item) => dimensionsForImage(item, "col"));
      return {
        width: exportConfig.naturalColWidth,
        height:
          parts.reduce((sum, item) => sum + item.height, 0) +
          Math.max(0, parts.length - 1) * gap,
        parts,
      };
    }

    return {
      width:
        state.cols * exportConfig.gridCellWidth +
        Math.max(0, state.cols - 1) * gap,
      height:
        state.rows * exportConfig.gridCellHeight +
        Math.max(0, state.rows - 1) * gap,
      parts: [],
    };
  }

  function drawPlaceholder(x, y, width, height, index) {
    ctx.save();
    ctx.fillStyle = "#fffefa";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#e3dfd2";
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
    ctx.fillStyle = "#8a8172";
    ctx.font = "28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`图片 ${index + 1}`, x + width / 2, y + height / 2);
    ctx.restore();
  }

  function drawImageContain(image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function drawImageCover(image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const cropWidth = width / scale;
    const cropHeight = height / scale;
    const cropX = (image.naturalWidth - cropWidth) / 2;
    const cropY = (image.naturalHeight - cropHeight) / 2;
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
  }

  function renderCanvas() {
    const size = computeCanvasSize();
    canvas.width = Math.max(1, size.width);
    canvas.height = Math.max(1, size.height);
    canvasSize.textContent = `${canvas.width} x ${canvas.height}`;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.rows === 1) {
      let x = 0;
      size.parts.forEach((part, index) => {
        const imageData = state.images[index];
        if (imageData) {
          ctx.drawImage(imageData.image, x, 0, part.width, part.height);
        } else {
          drawPlaceholder(x, 0, part.width, part.height, index);
        }
        x += part.width + state.gap;
      });
      return;
    }

    if (state.cols === 1) {
      let y = 0;
      size.parts.forEach((part, index) => {
        const imageData = state.images[index];
        if (imageData) {
          ctx.drawImage(imageData.image, 0, y, part.width, part.height);
        } else {
          drawPlaceholder(0, y, part.width, part.height, index);
        }
        y += part.height + state.gap;
      });
      return;
    }

    state.images.forEach((imageData, index) => {
      const col = index % state.cols;
      const row = Math.floor(index / state.cols);
      const x = col * (exportConfig.gridCellWidth + state.gap);
      const y = row * (exportConfig.gridCellHeight + state.gap);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, exportConfig.gridCellWidth, exportConfig.gridCellHeight);

      if (!imageData) {
        drawPlaceholder(
          x,
          y,
          exportConfig.gridCellWidth,
          exportConfig.gridCellHeight,
          index
        );
        return;
      }

      if (state.fit === "contain") {
        drawImageContain(
          imageData.image,
          x,
          y,
          exportConfig.gridCellWidth,
          exportConfig.gridCellHeight
        );
      } else {
        drawImageCover(
          imageData.image,
          x,
          y,
          exportConfig.gridCellWidth,
          exportConfig.gridCellHeight
        );
      }
    });
  }

  function downloadCanvas() {
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    link.download = `photo-join-${timestamp}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function render() {
    ensureImageSlots();
    renderTemplates();
    renderUploadGrid();
    renderCanvas();
  }

  gridFit.addEventListener("change", () => {
    state.fit = gridFit.value;
    renderCanvas();
  });

  gapSize.addEventListener("input", () => {
    state.gap = Number(gapSize.value);
    gapOutput.textContent = `${state.gap}px`;
    renderCanvas();
  });

  downloadBtn.addEventListener("click", downloadCanvas);

  clearAll.addEventListener("click", () => {
    state.images = state.images.map(() => null);
    render();
  });

  ensureImageSlots();
  render();
})();
