const container = document.querySelector(".data-container");
const sizeSlider = document.getElementById("size");
const speedSlider = document.getElementById("speed");

// Global State
let blocks = [];
let delay = 300;
let isAlgoRunning = false;

// Speed Mapping (1-5 slider to delay in ms)
// 1 = slowest (800ms), 5 = fastest (50ms)
const speedMap = {
    1: 800,
    2: 500,
    3: 300,
    4: 100,
    5: 20
};

// Colors
const COLOR_DEFAULT = "#3b82f6"; // Blue
const COLOR_COMPARE = "#eab308"; // Yellow
const COLOR_SWAP = "#ef4444";    // Red
const COLOR_SORTED = "#22c55e";  // Green
const COLOR_FOUND = "#a855f7";   // Purple

// Initial Setup
sizeSlider.addEventListener("input", generate);
speedSlider.addEventListener("input", (e) => {
    delay = speedMap[e.target.value];
});

// Generate Random Array
function generate() {
    if (isAlgoRunning) return;

    container.innerHTML = "";
    blocks = [];

    // Get size from slider
    const num = parseInt(sizeSlider.value);

    // Calculate width relative to container width to fit all bars
    // Container width is ~1000px max, but let's be dynamic
    // gap is 2px
    const containerWidth = container.clientWidth;
    const totalGap = (num - 1) * 2;
    const availableWidth = containerWidth - totalGap;
    const barWidth = Math.floor(availableWidth / num);

    for (let i = 0; i < num; i++) {
        const value = Math.floor(Math.random() * 100) + 1; // 1-100
        const bar = document.createElement("div");

        bar.classList.add("bar");
        bar.style.height = `${value * 3.5}px`; // Scale up for visibility
        bar.style.width = `${barWidth}px`;
        bar.style.transform = `translateX(0)`; // Reset transform if any

        // Add label if bars are wide enough
        if (barWidth > 25) {
            const label = document.createElement("label");
            label.classList.add("bar__id");
            label.innerHTML = value;
            label.style.display = "block";
            bar.appendChild(label);
        }

        container.appendChild(bar);
        blocks.push({
            element: bar,
            value: value
        });
    }
}

// Helpers
function wait() {
    return new Promise(resolve => setTimeout(resolve, delay));
}

function setColor(index, color) {
    if (blocks[index]) {
        blocks[index].element.style.backgroundColor = color;
    }
}

async function swap(i, j) {
    const tempHeight = blocks[i].element.style.height;
    blocks[i].element.style.height = blocks[j].element.style.height;
    blocks[j].element.style.height = tempHeight;

    // Update labels if they exist
    const labelI = blocks[i].element.querySelector("label");
    const labelJ = blocks[j].element.querySelector("label");

    if (labelI && labelJ) {
        const tempText = labelI.innerText;
        labelI.innerText = labelJ.innerText;
        labelJ.innerText = tempText;
    }

    // Swap values in our tracking array
    const tempVal = blocks[i].value;
    blocks[i].value = blocks[j].value;
    blocks[j].value = tempVal;

    await wait();
}

// === Algorithms ===

async function bubbleSort() {
    for (let i = 0; i < blocks.length; i++) {
        for (let j = 0; j < blocks.length - i - 1; j++) {
            setColor(j, COLOR_COMPARE);
            setColor(j + 1, COLOR_COMPARE);

            await wait();

            if (blocks[j].value > blocks[j + 1].value) {
                setColor(j, COLOR_SWAP);
                setColor(j + 1, COLOR_SWAP);
                await swap(j, j + 1);
            }

            setColor(j, COLOR_DEFAULT);
            setColor(j + 1, COLOR_DEFAULT);
        }
        setColor(blocks.length - i - 1, COLOR_SORTED);
    }
    setColor(0, COLOR_SORTED); // Ensure first is green
}

async function selectionSort() {
    for (let i = 0; i < blocks.length; i++) {
        let minIdx = i;
        setColor(i, COLOR_COMPARE);
        for (let j = i + 1; j < blocks.length; j++) {
            setColor(j, COLOR_COMPARE);
            await wait();

            if (blocks[j].value < blocks[minIdx].value) {
                if (minIdx !== i) setColor(minIdx, COLOR_DEFAULT); // Reset old min
                minIdx = j;
                setColor(minIdx, COLOR_SWAP); // Found new min
            } else {
                setColor(j, COLOR_DEFAULT);
            }
        }
        await swap(i, minIdx);
        setColor(minIdx, COLOR_DEFAULT);
        setColor(i, COLOR_SORTED);
    }
}

async function insertionSort() {
    for (let i = 1; i < blocks.length; i++) {
        let j = i;
        setColor(i, COLOR_COMPARE);
        while (j > 0 && blocks[j].value < blocks[j - 1].value) {
            setColor(j, COLOR_SWAP);
            setColor(j - 1, COLOR_SWAP);
            await swap(j, j - 1);
            setColor(j, COLOR_DEFAULT);
            j--;
        }
        setColor(i, COLOR_DEFAULT);
        // Optimization: Mark sorted part? Insertion sort doesn't strictly have a "sorted end" until done, 
        // but for viz, we can leave them default until the very end or color them progressively.
        // Let's just color all green at the end.
    }
    // Final pass to green
    for (let k = 0; k < blocks.length; k++) {
        setColor(k, COLOR_SORTED);
        await new Promise(r => setTimeout(r, 10)); // fast ripple
    }
}

// Quick Sort Helpers
async function partition(l, r) {
    let pivotIndex = l;
    let pivotValue = blocks[pivotIndex].value;
    setColor(pivotIndex, COLOR_SWAP); // Pivot color

    let i = l + 1;

    for (let j = l + 1; j <= r; j++) {
        setColor(j, COLOR_COMPARE);
        await wait();

        if (blocks[j].value < pivotValue) {
            setColor(j, COLOR_SWAP);
            setColor(i, COLOR_SWAP);
            if (i !== j) await swap(i, j);
            setColor(i, COLOR_DEFAULT);
            i++;
        }
        setColor(j, COLOR_DEFAULT);
    }
    await swap(l, i - 1);
    setColor(i - 1, COLOR_SORTED); // Pivot is now in correct place
    return i - 1;
}

async function quickSort(l = 0, r = blocks.length - 1) {
    if (l <= r) {
        let currPivot = await partition(l, r);
        await quickSort(l, currPivot - 1);
        await quickSort(currPivot + 1, r);
    }
    if (l === 0 && r === blocks.length - 1) {
        // ensure all green at end (redundancy)
        for (let k = 0; k < blocks.length; k++) setColor(k, COLOR_SORTED);
    }
}

// Merge Sort Helpers
async function merge(l, m, r) {
    let n1 = m - l + 1;
    let n2 = r - m;

    // We can't really "create" separate arrays visibly easily without breaking layout.
    // Instead we'll use an in-place-ish visualization or just copy values.
    // For visualization simplicity, let's copy values.

    let left = [];
    let right = [];

    for (let i = 0; i < n1; i++) left.push(blocks[l + i].value);
    for (let j = 0; j < n2; j++) right.push(blocks[m + 1 + j].value);

    let i = 0, j = 0, k = l;

    while (i < n1 && j < n2) {
        setColor(k, COLOR_COMPARE);
        await wait();

        // Visualize the comparison ?
        // Effectively we are overwriting k with the smaller of the two heads

        if (left[i] <= right[j]) {
            blocks[k].value = left[i];
            blocks[k].element.style.height = `${left[i] * 3.5}px`;
            if (blocks[k].element.querySelector("label")) blocks[k].element.querySelector("label").innerText = left[i];
            i++;
        } else {
            blocks[k].value = right[j];
            blocks[k].element.style.height = `${right[j] * 3.5}px`;
            if (blocks[k].element.querySelector("label")) blocks[k].element.querySelector("label").innerText = right[j];
            j++;
        }
        setColor(k, COLOR_DEFAULT); // Flash comparison
        k++;
    }

    while (i < n1) {
        setColor(k, COLOR_SWAP);
        await wait();
        blocks[k].value = left[i];
        blocks[k].element.style.height = `${left[i] * 3.5}px`;
        if (blocks[k].element.querySelector("label")) blocks[k].element.querySelector("label").innerText = left[i];
        setColor(k, COLOR_DEFAULT);
        i++;
        k++;
    }

    while (j < n2) {
        setColor(k, COLOR_SWAP);
        await wait();
        blocks[k].value = right[j];
        blocks[k].element.style.height = `${right[j] * 3.5}px`;
        if (blocks[k].element.querySelector("label")) blocks[k].element.querySelector("label").innerText = right[j];
        setColor(k, COLOR_DEFAULT);
        j++;
        k++;
    }
}

async function mergeSort(l = 0, r = blocks.length - 1) {
    if (l >= r) return;

    let m = l + Math.floor((r - l) / 2);
    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);

    // Visualize sorted section for this level?
    // It's hard to verify "sorted" definitively for sub-arrays without logic.
    // We'll leave greening for completion.
    if (l === 0 && r === blocks.length - 1) {
        for (let k = 0; k < blocks.length; k++) setColor(k, COLOR_SORTED);
    }
}


async function linearSearch() {
    // Pick a random target from the array to ensure it exists for demo purposes
    // Or allow a "not found" case. Let's pick a random existing one.
    const targetIdx = Math.floor(Math.random() * blocks.length);
    const target = blocks[targetIdx].value;

    alert(`Searching for target: ${target}`);

    for (let i = 0; i < blocks.length; i++) {
        setColor(i, COLOR_COMPARE);
        await wait();

        if (blocks[i].value === target) {
            setColor(i, COLOR_FOUND);
            alert(`Found ${target} at index ${i}!`);
            return;
        } else {
            setColor(i, COLOR_DEFAULT);
            blocks[i].element.style.opacity = '0.5'; // dimmed checked
        }
    }
}

async function binarySearch() {
    // Needs sorted array. Force sort first?
    // Or assume user clicked sorted.
    // Let's check if sorted, if not, quick sort it fast without delay? 
    // No, better to alert user.
    // But for "User Experience", let's just sort it instantly behind the scenes or run a sort viz first.
    // Let's run a quick "Sort first" message or just sort comparison-less.

    // Let's just do:
    alert("Binary Search requires a sorted array. Sorting first...");
    await quickSort(); // Actually visualize the sort first!
    await new Promise(r => setTimeout(r, 1000)); // Pause before search

    // Clear colors
    for (let k = 0; k < blocks.length; k++) setColor(k, COLOR_DEFAULT);

    const targetIdx = Math.floor(Math.random() * blocks.length);
    const target = blocks[targetIdx].value;

    alert(`Searching for target: ${target}`);

    let l = 0, r = blocks.length - 1;
    while (l <= r) {
        let mid = Math.floor(l + (r - l) / 2);
        setColor(mid, COLOR_COMPARE);
        await wait();

        if (blocks[mid].value === target) {
            setColor(mid, COLOR_FOUND);
            alert(`Found ${target} at index ${mid}!`);
            return;
        }

        if (blocks[mid].value < target) {
            // Darken left side
            for (let k = l; k <= mid; k++) blocks[k].element.style.opacity = '0.3';
            l = mid + 1;
        } else {
            // Darken right side
            for (let k = mid; k <= r; k++) blocks[k].element.style.opacity = '0.3';
            r = mid - 1;
        }
    }
}


// Master Runner
async function runAlgo(algoName) {
    if (isAlgoRunning) return;
    isAlgoRunning = true;

    // Disable controls
    sizeSlider.disabled = true;
    document.querySelectorAll(".btn").forEach(b => b.disabled = true);
    document.querySelectorAll(".algo-card").forEach(c => c.style.pointerEvents = "none");

    // Reset colors/opacity
    blocks.forEach(b => {
        b.element.style.backgroundColor = COLOR_DEFAULT;
        b.element.style.opacity = '1';
    });

    switch (algoName) {
        case 'Bubble': await bubbleSort(); break;
        case 'Selection': await selectionSort(); break;
        case 'Insertion': await insertionSort(); break;
        case 'Quick': await quickSort(); break;
        case 'Merge': await mergeSort(); break;
        case 'Linear': await linearSearch(); break;
        case 'Binary': await binarySearch(); break;
    }

    isAlgoRunning = false;
    sizeSlider.disabled = false;
    document.querySelectorAll(".btn").forEach(b => b.disabled = false);
    document.querySelectorAll(".algo-card").forEach(c => c.style.pointerEvents = "auto");
}

// Init
generate();