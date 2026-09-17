
    const GAS_URL = "https://script.google.com/macros/s/AKfycbyt5e7zS1x8MXnEYITHnedX_arL5ruFhSgH49MZ5V_zGeK7S1dTb59pqRTalJz-btjz0g/exec";
    let chartInstance = null;

    // 頁面載入後自動取得並繪製圖表
    window.onload = fetchChartData;

    async function submitData() {
      const person = document.getElementById('person').value;
      const weight = document.getElementById('weight').value;
      const bodyfat = document.getElementById('bodyfat').value;
      const muscle = document.getElementById('muscle').value;
      const intestinefat = document.getElementById('intestinefat').value;
      const calories = document.getElementById('calories').value;
      const status = document.getElementById('status');
      const btn = document.getElementById('btn');

      if (!person || !weight) {
        status.style.color = "#dc3545";
        status.innerText = "⚠️ 請至少填寫姓名與體重！";
        return;
      }

      btn.disabled = true;
      status.style.color = "#007bff";
      status.innerText = "傳送中...";

      try {
        await fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person: person,
            weight: weight,
            bodyfat: bodyfat,
            muscle: muscle,
            intestinefat: intestinefat,
            calories: calories
          })
        });
        
        status.style.color = "#28a745";
        status.innerText = "✅ 紀錄成功！已同步至 Google Sheets";
        
        // 清空數字欄位
        document.getElementById('weight').value = '';
        document.getElementById('bodyfat').value = '';
        document.getElementById('muscle').value = '';
        document.getElementById('intestinefat').value = '';
        document.getElementById('calories').value = '';

        // 新增：寫入成功後自動更新折線圖（延遲 1.5 秒等 GAS 處理完成）
        setTimeout(fetchChartData, 1500);
      } catch (err) {
        status.style.color = "#dc3545";
        status.innerText = "❌ 傳送失敗，請確認 API 網址";
      } finally {
        btn.disabled = false;
      }
    } // 2. 修正：將 submitData 的結束大括號移至此處

    // 抓取後端資料
    async function fetchChartData() {
      try {
        const res = await fetch(GAS_URL);
        const rawData = await res.json();
        
        // 渲染圖表
        renderChart(rawData);
      } catch (err) {
        console.error("無法載入圖表資料:", err);
      }
    }

    // 繪製 Chart.js 折線圖
    function renderChart(data) {
      // 擷取所有的日期標籤 (不重複，取最近 7 天)
      const labels = [...new Set(data.map(d => d.date))].slice(-7);

      // 整理 比比 與 皮皮 的體脂肪數據
      const bibiData = labels.map(date => {
        const item = data.filter(d => d.date === date && d.person === "比比").pop();
        return item ? item.bodyfat : null;
      });

      const pipiData = labels.map(date => {
        const item = data.filter(d => d.date === date && d.person === "皮皮").pop();
        return item ? item.bodyfat : null;
      });

      const ctx = document.getElementById('bodyfatChart').getContext('2d');

      // 若已有舊圖表先銷毀，再重新繪製
      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: '比比 (%)',
              data: bibiData,
              borderColor: '#ff6384',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              tension: 0.3,
              spanGaps: true
            },
            {
              label: '皮皮 (%)',
              data: pipiData,
              borderColor: '#36a2eb',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.3,
              spanGaps: true
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: { display: true, text: '體脂肪 (%)' }
            }
          }
        }
      });
    }