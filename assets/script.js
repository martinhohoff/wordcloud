const generateButton = document.getElementById('generate-button');
const wordCloudImage = document.getElementById('word-cloud-image');
const downloadButton = document.getElementById('download-button');

// Stopword lists for English and Portuguese
const stopwordsEn = new Set(["the", "and", "a", "to", "of", "in", "is", "it", "you", "that", "he", "was", "for", "on", "are", "with", "as", "I", "his", "they", "be", "at", "one", "have", "this", "from", "or", "had", "by", "not", "word", "but", "what", "some", "we", "can", "out", "other", "were", "all", "there", "when", "up", "use", "your", "how", "said", "an", "each", "she"]);
const stopwordsPt = new Set(["e", "de", "o", "a", "que", "do", "da", "em", "um", "para", "é", "com", "não", "uma", "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas", "foi", "ao", "ele", "das", "tem", "à", "seu", "sua", "ou", "ser", "quando", "muito", "há", "nos", "já", "está", "eu", "também", "só", "pelo", "pela", "até", "isso"]);

// Hide the image, spinner, and download button initially
wordCloudImage.style.display = 'none';
downloadButton.style.display = 'none';

// Function to clean words by removing numbers, single characters, and punctuation at both start and end
function cleanWord(word) {
    word = word.replace(/^[\(\[.,!?;:]+|\d+/g, '').replace(/[.,!?;:]+$/, '').toLowerCase();
    return word.length > 1 ? word : ''; // Ignore single characters
}

// Generate Word Cloud
generateButton.addEventListener('click', () => {
    const text = document.getElementById('text-input').value.trim();
    if (!text) {
        alert('Please enter some text to generate a word cloud!');
        return;
    }

    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Detect language (simple heuristic based on common words)
    const isPortuguese = /\b(que|de|e|uma|para)\b/i.test(text);
    const stopwords = isPortuguese ? stopwordsPt : stopwordsEn;

    // Calculate word frequencies (excluding stopwords)
    const wordCounts = {};
    text.split(/\s+/).forEach(word => {
        word = cleanWord(word);
        if (word && !stopwords.has(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    // Convert word counts to an array of word objects with enhanced scaling
    const words = Object.keys(wordCounts).map(word => ({
        text: word,
        size: Math.pow(wordCounts[word], 1.2) * 8 // Adjusted scaling to reduce oversized words
    }));

    // Create the word cloud
    d3.layout.cloud()
        .size([700, 700]) // Increased canvas size
        .words(words)
        .padding(5) // Increased padding to reduce collisions
        .rotate(() => Math.random() > 0.8 ? 90 : 0) // Mostly horizontal
        .fontSize(d => d.size)
        .spiral("archimedean") // Fixed spiral type
        .on('end', draw)
        .start();
});

function draw(words) {
    // Create the SVG element
    const svg = d3.select('#word-cloud-container')
        .append('svg')
        .attr('width', 700)
        .attr('height', 700)
        .append('g')
        .attr('transform', 'translate(350,350)');

    // Define color schemes
    const colorSchemes = [
        d3.scaleOrdinal(d3.schemeCategory10), // Bold colors
        d3.scaleOrdinal(["#ff6f61", "#6b5b95", "#88b04b", "#d65076", "#45b8ac", "#e94b3c", "#6b4226", "#f4a7b9", "#9b2335", "#5b5ea6"]) // Custom elegant palette
    ];

    // Randomly choose a color scheme
    const color = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

    // Add text elements
    svg.selectAll('text')
        .data(words)
        .enter().append('text')
        .style('font-size', d => `${d.size}px`)
        .style('fill', d => color(d.text))
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text);

    // Convert SVG to PNG using a canvas
    const svgElement = document.querySelector('svg');
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    // Add a white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const xml = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;

    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const pngData = canvas.toDataURL('image/png');

        // Set the image source and display it
        wordCloudImage.src = pngData;
        wordCloudImage.style.display = 'block';

        // Show the download button
        downloadButton.style.display = 'inline-block';

        // Add download functionality
        downloadButton.onclick = () => {
            const link = document.createElement('a');
            link.href = pngData;
            link.download = 'word-cloud.png';
            link.click();
        };
    };

    // Remove the old SVG to avoid overlap
    svgElement.remove();
}
