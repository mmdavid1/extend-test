const $ = (id) => document.getElementById(id);

$("runBtn").onclick = async () => {
  const processorId = $("processorId").value.trim();
  const file = $("fileInput").files[0];
  if (!processorId || !file) {
    alert("Provide a Processor ID and choose a file.");
    return;
  }

  $("output").textContent = "Uploading…";

  // 1) Upload to your proxy (which forwards to Extend)
  const form = new FormData();
  form.append("file", file);
  const up = await fetch("http://localhost:3000/api/upload", { method: "POST", body: form });
  if (!up.ok) {
    const err = await up.json().catch(() => ({}));
    $("output").textContent = "Upload failed:\n" + JSON.stringify(err, null, 2);
    return;
  }
  const { fileId } = await up.json();

  // 2) Run processor via your proxy
  $("output").textContent = "Running extractor…";
  const runRes = await fetch("http://localhost:3000/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      processorId,
      fileId,      // or pass fileUrl instead
      sync: true,  // for quick, blocking runs
      // config: { ... } // optionally pass your schema config if not saved in Studio
    }),
  });

  const payload = await runRes.json();
  $("output").textContent = JSON.stringify(payload, null, 2);
};

// Optional drag & drop UX
const dz = $("dropZone");
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.style.opacity = 0.7; });
dz.addEventListener("dragleave", () => { dz.style.opacity = 1; });
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.style.opacity = 1;
  if (e.dataTransfer.files?.length) $("fileInput").files = e.dataTransfer.files;
});
