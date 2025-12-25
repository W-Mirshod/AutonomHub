document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generate-form');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.spinner');
    const statusMsg = document.getElementById('status-msg');
    const previewSection = document.getElementById('preview-section');
    const resultVideo = document.getElementById('result-video');
    const downloadBtn = document.getElementById('download-btn');
    const resultCaption = document.getElementById('result-caption');
    const copyCaptionBtn = document.getElementById('copy-caption-btn');
    const analysisDetails = document.getElementById('analysis-details');
    const analysisPrompt = document.getElementById('analysis-prompt');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset state
        setLoading(true);
        previewSection.classList.add('hidden');
        analysisDetails.classList.add('hidden');
        updateStatus("Initializing AI Director...");

        const imageUrl = document.getElementById('image-url').value;
        const prompt = document.getElementById('prompt').value;

        try {
            // Simulate status steps for UX (since the backend is one big await blocks)
            setTimeout(() => updateStatus("Vision Director: Analyzing image..."), 800);
            setTimeout(() => updateStatus("Motion Engine: Generating video frames..."), 2500);
            setTimeout(() => updateStatus("Stitcher: Assembling final cut..."), 4500);

            const response = await fetch('/api/v1/animate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_url: imageUrl,
                    prompt: prompt
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.video_url) {
                showResult(data);
            } else {
                throw new Error("Unexpected response from server");
            }

        } catch (error) {
            updateStatus(`Failed: ${error.message}`, true);
        } finally {
            setLoading(false);
        }
    });

    downloadBtn.addEventListener('click', () => {
        const videoUrl = resultVideo.src;
        if (videoUrl) {
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = 'autonomhub-video.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });

    copyCaptionBtn.addEventListener('click', () => {
        const textToCopy = resultCaption.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyCaptionBtn.textContent;
            copyCaptionBtn.textContent = "Copied!";
            setTimeout(() => copyCaptionBtn.textContent = originalText, 2000);
        });
    });

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('text-hidden');
            spinner.classList.remove('text-hidden');
        } else {
            btnText.classList.remove('text-hidden');
            spinner.classList.add('text-hidden');
        }
    }

    function updateStatus(msg, isError = false) {
        statusMsg.textContent = msg;
        statusMsg.style.color = isError ? "#ef4444" : "var(--text-muted)";
    }

    function showResult(data) {
        resultVideo.src = data.video_url;

        // Show Caption
        if (data.caption) {
            resultCaption.textContent = data.caption;
        }

        // Show Analysis
        if (data.analysis && data.analysis.rich_prompt) {
            analysisPrompt.textContent = data.analysis.rich_prompt;
            analysisDetails.classList.remove('hidden');
        }

        previewSection.classList.remove('hidden');
        updateStatus("Production complete!", false);
        statusMsg.style.color = "#10b981";

        // smooth scroll to result
        previewSection.scrollIntoView({ behavior: 'smooth' });
        resultVideo.play().catch(e => console.log("Auto-play prevented"));
    }
});
