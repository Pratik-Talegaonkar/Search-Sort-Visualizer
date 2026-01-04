const container = document.querySelector(".data-container");
function generate(num = 20) {
    container.innerHTML = '';
    for (let i = 0; i < num; i++) {
        const value = Math.floor(Math.random() * 100) + 1;
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${value * 3}px`;
        bar.style.transform = `translateX(${i * 30}px)`;
        const barLabel = document.createElement("label");
        barLabel.classList.add("bar__id");
        barLabel.innerHTML = value;
        bar.appendChild(barLabel);
        container.appendChild(bar);
    }
}

async function SelectionSort(delay = 30) {
    let bars = document.querySelectorAll(".bar");
    for(let i = 0 ; i < bars.length ; i++) {
        let min_idx = i;
        bars[i].style.backgroundColor = "darkblue";
        for(let j = i + 1 ; j < bars.length ; j++) {
            bars[j].style.backgroundColor = "red";
            await new Promise(resolve => setTimeout(resolve,delay));
            let val1 = parseInt(bars[j].childNodes[0].innerHTML);
            let val2 = parseInt(bars[min_idx].childNodes[0].innerHTML);
            if(val1 < val2) {
                if(min_idx !== i) {
                    bars[min_idx].style.backgroundColor = "#007bff";
                }
                min_idx = j;
            }
            else {
                bars[j].style.backgroundColor = "#007bff";
            }
        }
        let tempHeight = bars[min_idx].style.height;
        let tempLabel = bars[min_idx].childNodes[0].innerText;
        bars[min_idx].style.height = bars[i].style.height;
        bars[i].style.height = tempHeight;
        bars[min_idx].childNodes[0].innerText = bars[i].childNodes[0].innerText;
        bars[i].childNodes[0].innerText = tempLabel;
        await new Promise(resolve => setTimeout(resolve,delay));
        bars[min_idx].style.backgroundColor = "#007bff";
        bars[i].style.backgroundColor = "green";
    }
    enableButtons();
}

function disableButtons() {
    document.querySelector(".btn").forEach(btn => btn.disabled = true);
}

function enableButtons() {
    document.querySelector(".btn").forEach(btn => btn.disabled = false);
}

generate();