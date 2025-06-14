// Predictive Analytics JavaScript
let riskChart;
let predictionHistory = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    setupFormHandlers();
    setupSliderSync();
    setupPresets();
});

// Initialize risk trend chart
function initializeChart() {
    const ctx = document.getElementById('riskChart').getContext('2d');
    
    riskChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Risk Score',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }, {
                label: 'Risk Threshold',
                data: [],
                borderColor: '#f59e0b',
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e5e7eb' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' }
                },
                y: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' },
                    beginAtZero: true,
                    max: 100
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
    
    // Initialize with empty data
    updateChart([], 50); // 50 is the risk threshold
}

// Setup form submission handler
function setupFormHandlers() {
    const form = document.getElementById('predictionForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await runPrediction();
    });
}

// Setup slider and input synchronization
function setupSliderSync() {
    // Temperature sync
    const tempInput = document.getElementById('temperature');
    const tempRange = document.getElementById('tempRange');
    
    tempInput.addEventListener('input', function() {
        tempRange.value = this.value;
    });
    
    tempRange.addEventListener('input', function() {
        tempInput.value = this.value;
    });
    
    // Pressure sync
    const pressureInput = document.getElementById('pressure');
    const pressureRange = document.getElementById('pressureRange');
    
    pressureInput.addEventListener('input', function() {
        pressureRange.value = this.value;
    });
    
    pressureRange.addEventListener('input', function() {
        pressureInput.value = this.value;
    });
    
    // Vibration sync
    const vibrationInput = document.getElementById('vibration');
    const vibrationRange = document.getElementById('vibrationRange');
    
    vibrationInput.addEventListener('input', function() {
        vibrationRange.value = this.value;
    });
    
    vibrationRange.addEventListener('input', function() {
        vibrationInput.value = this.value;
    });
    
    // Humidity sync
    const humidityInput = document.getElementById('humidity');
    const humidityRange = document.getElementById('humidityRange');
    
    humidityInput.addEventListener('input', function() {
        humidityRange.value = this.value;
    });
    
    humidityRange.addEventListener('input', function() {
        humidityInput.value = this.value;
    });
}

// Setup preset configurations
function setupPresets() {
    // Presets are handled by onclick attributes in HTML
    // This function can be extended for additional preset logic
}

// Set preset values
function setPreset(presetType) {
    const tempInput = document.getElementById('temperature');
    const tempRange = document.getElementById('tempRange');
    const pressureInput = document.getElementById('pressure');
    const pressureRange = document.getElementById('pressureRange');
    const vibrationInput = document.getElementById('vibration');
    const vibrationRange = document.getElementById('vibrationRange');
    const humidityInput = document.getElementById('humidity');
    const humidityRange = document.getElementById('humidityRange');
    
    let values;
    
    switch (presetType) {
        case 'normal':
            values = { temp: 72, pressure: 1.2, vibration: 0.3, humidity: 45 };
            break;
        case 'warning':
            values = { temp: 82, pressure: 1.9, vibration: 0.7, humidity: 65 };
            break;
        case 'critical':
            values = { temp: 95, pressure: 2.3, vibration: 1.2, humidity: 80 };
            break;
        case 'optimal':
            values = { temp: 70, pressure: 1.1, vibration: 0.2, humidity: 50 };
            break;
        default:
            return;
    }
    
    // Set input values
    tempInput.value = values.temp;
    tempRange.value = values.temp;
    pressureInput.value = values.pressure;
    pressureRange.value = values.pressure;
    vibrationInput.value = values.vibration;
    vibrationRange.value = values.vibration;
    humidityInput.value = values.humidity;
    humidityRange.value = values.humidity;
    
    // Add visual feedback
    showPresetFeedback(presetType);
}

// Show feedback when preset is applied
function showPresetFeedback(presetType) {
    const button = event.target;
    const originalText = button.textContent;
    
    button.textContent = '✓ Applied';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1500);
}

// Run prediction analysis
async function runPrediction() {
    const predictBtn = document.getElementById('predictBtn');
    const predictBtnText = document.getElementById('predictBtnText');
    const predictSpinner = document.getElementById('predictSpinner');
    const initialState = document.getElementById('initialState');
    const predictionResults = document.getElementById('predictionResults');
    
    // Show loading state
    predictBtn.disabled = true;
    predictBtnText.textContent = 'Analyzing...';
    predictSpinner.classList.remove('hidden');
    
    try {
        // Collect form data
        const formData = {
            temperature: parseFloat(document.getElementById('temperature').value),
            pressure: parseFloat(document.getElementById('pressure').value),
            vibration: parseFloat(document.getElementById('vibration').value),
            humidity: parseFloat(document.getElementById('humidity').value)
        };
        
        // Validate input data
        if (!validateInputData(formData)) {
            throw new Error('Invalid input data provided');
        }
        
        // Make API call
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction failed');
        }
        
        const result = await response.json();
        
        // Store prediction in history
        predictionHistory.push({
            timestamp: new Date(),
            input: formData,
            result: result
        });
        
        // Update displays
        displayPredictionResults(result);
        updateChart(predictionHistory, 50);
        
        // Hide initial state and show results
        initialState.classList.add('hidden');
        predictionResults.classList.remove('hidden');
        
    } catch (error) {
        console.error('Prediction error:', error);
        showError(error.message);
    } finally {
        // Reset button state
        predictBtn.disabled = false;
        predictBtnText.textContent = 'Run Prediction';
        predictSpinner.classList.add('hidden');
    }
}

// Validate input data
function validateInputData(data) {
    return (
        data.temperature >= 0 && data.temperature <= 200 &&
        data.pressure >= 0 && data.pressure <= 5 &&
        data.vibration >= 0 && data.vibration <= 2 &&
        data.humidity >= 0 && data.humidity <= 100
    );
}

// Display prediction results
function displayPredictionResults(result) {
    // Update risk metrics
    document.getElementById('riskScore').textContent = result.risk_score;
    document.getElementById('riskLevel').textContent = result.risk_level;
    document.getElementById('predictionTime').textContent = new Date(result.timestamp).toLocaleTimeString();
    
    // Color code risk level
    const riskLevelElement = document.getElementById('riskLevel');
    riskLevelElement.className = 'text-lg font-semibold mb-2';
    
    switch (result.risk_level) {
        case 'High Risk':
            riskLevelElement.classList.add('text-red-400');
            break;
        case 'Medium Risk':
            riskLevelElement.classList.add('text-yellow-400');
            break;
        case 'Low Risk':
            riskLevelElement.classList.add('text-green-400');
            break;
        default:
            riskLevelElement.classList.add('text-gray-400');
    }
    
    // Display risk factors
    const riskFactorsContainer = document.getElementById('riskFactors');
    if (result.risk_factors && result.risk_factors.length > 0) {
        riskFactorsContainer.innerHTML = result.risk_factors.map(factor => `
            <div class="flex items-center p-2 bg-slate-700/50 rounded">
                <i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i>
                <span class="text-sm text-gray-300">${factor}</span>
            </div>
        `).join('');
    } else {
        riskFactorsContainer.innerHTML = `
            <div class="flex items-center p-2 bg-green-500/10 rounded">
                <i class="fas fa-check text-green-400 mr-2"></i>
                <span class="text-sm text-gray-300">No risk factors identified</span>
            </div>
        `;
    }
    
    // Display recommendation
    document.getElementById('recommendation').textContent = result.recommendation;
}

// Update risk trend chart
function updateChart(history, threshold) {
    if (!riskChart || !history) return;
    
    const labels = history.map(item => item.timestamp.toLocaleTimeString());
    const scores = history.map(item => item.result.risk_score);
    const thresholdData = new Array(scores.length).fill(threshold);
    
    riskChart.data.labels = labels;
    riskChart.data.datasets[0].data = scores;
    riskChart.data.datasets[1].data = thresholdData;
    
    riskChart.update();
}

// Show error message
function showError(message) {
    const predictionResults = document.getElementById('predictionResults');
    const initialState = document.getElementById('initialState');
    
    // Hide initial state
    initialState.classList.add('hidden');
    
    // Show error in results area
    predictionResults.innerHTML = `
        <div class="text-center py-12">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2 text-red-400">Prediction Error</h3>
            <p class="text-gray-400 mb-4">${message}</p>
            <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <i class="fas fa-refresh mr-2"></i>
                Try Again
            </button>
        </div>
    `;
    
    predictionResults.classList.remove('hidden');
    
    // Auto-hide error after 10 seconds
    setTimeout(() => {
        predictionResults.classList.add('hidden');
        initialState.classList.remove('hidden');
    }, 10000);
}

// Export prediction report
function exportReport() {
    if (predictionHistory.length === 0) {
        alert('No prediction data to export');
        return;
    }
    
    const reportData = {
        generated_at: new Date().toISOString(),
        predictions: predictionHistory.map(item => ({
            timestamp: item.timestamp.toISOString(),
            inputs: item.input,
            results: item.result
        })),
        summary: {
            total_predictions: predictionHistory.length,
            average_risk_score: predictionHistory.reduce((sum, item) => sum + item.result.risk_score, 0) / predictionHistory.length,
            high_risk_count: predictionHistory.filter(item => item.result.risk_level === 'High Risk').length
        }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartx_prediction_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (riskChart) {
        riskChart.destroy();
    }
});

// Make functions globally available
window.setPreset = setPreset;
window.exportReport = exportReport;
