document.addEventListener("DOMContentLoaded", () => {
    const imageUpload = document.getElementById("image-upload");
    const analyzeButton = document.getElementById("analyze-button");
    const imagePreview = document.getElementById("image-preview");
    const resultsOutput = document.getElementById("results-output");
    const bottomNav = document.getElementById("bottom-nav");
    const loader = document.getElementById("loader");

    let originalAnalysis = {};

    imageUpload.addEventListener("change", () => {
        const file = imageUpload.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Image preview" />`;
            };
            reader.readAsDataURL(file);
        }
    });

    analyzeButton.addEventListener("click", async () => {
        const file = imageUpload.files[0];
        if (!file) {
            alert("Please upload an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        resultsOutput.innerHTML = "<p>Analyzing...</p>";
        bottomNav.innerHTML = "";

        try {
            const response = await fetch("/analyze", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                originalAnalysis = await response.json();
                displayAnalysis(originalAnalysis);
                setupBottomNav();
            } else {
                const error = await response.json();
                resultsOutput.innerHTML = `<p>Error: ${error.error}</p>`;
            }
        } catch (error) {
            resultsOutput.innerHTML = `<p>An unexpected error occurred: ${error}</p>`;
        }
    });

    function displayAnalysis(data) {
        if (data.disease_name === "Healthy") {
            resultsOutput.innerHTML = "<p>The plant appears to be <strong>Healthy</strong>.</p>";
            return;
        }

        resultsOutput.innerHTML = `
            <div id="problem-section">
                <h2>Problem</h2>
                <p><strong>Disease:</strong> ${data.disease_name}</p>
                <p><strong>Confidence:</strong> ${(data.confidence_score * 100).toFixed(2)}%</p>
                <div>${data.description}</div>
            </div>
            <div id="solution-section">
                <h2>Solution</h2>
                <div>${data.treatment_recommendation}</div>
            </div>
        `;
    }

    function setupBottomNav() {
        if (originalAnalysis.disease_name === "Healthy") return;

        bottomNav.innerHTML = `
            <button id="problem-nav-button">Problem</button>
            <button id="solution-nav-button">Solution</button>
            <button id="translate-nav-button">Translate to Malayalam</button>
        `;

        document.getElementById("problem-nav-button").addEventListener("click", () => {
            document.getElementById("problem-section").scrollIntoView({ behavior: "smooth" });
        });

        document.getElementById("solution-nav-button").addEventListener("click", () => {
            document.getElementById("solution-section").scrollIntoView({ behavior: "smooth" });
        });

        document.getElementById("translate-nav-button").addEventListener("click", async () => {
            loader.classList.remove("loader-hidden");
            const problemText = document.querySelector("#problem-section").innerText;
            const solutionText = document.querySelector("#solution-section").innerText;
            const textToTranslate = `${problemText}\n${solutionText}`;

            try {
                const response = await fetch("/translate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ text: textToTranslate }),
                });

                if (response.ok) {
                    const data = await response.json();
                    resultsOutput.innerHTML = `<p>${data.translation.replace(/\n/g, '<br>')}</p>`;
                    bottomNav.innerHTML = ""; // Hide nav after translation
                } else {
                    const error = await response.json();
                    alert(`Translation Error: ${error.error}`);
                }
            } catch (error) {
                alert(`An unexpected error occurred during translation: ${error}`);
            } finally {
                loader.classList.add("loader-hidden");
            }
        });
    }
});