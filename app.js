// Installment calculator data with simple interest rates
const installmentOptions = [
    {
        months: 6,
        annual_rate: 19,
        fees: 50,
        title: "6 شهور"
    },
    {
        months: 12,
        annual_rate: 38,
        fees: 50,
        title: "12 شهر"
    },
    {
        months: 18,
        annual_rate: 57,
        fees: 50,
        title: "18 شهر"
    }
];

// DOM elements
const amountInput = document.getElementById('amount-input');
const calculateBtn = document.getElementById('calculate-btn');
const clearBtn = document.getElementById('clear-btn');
const resultsSection = document.getElementById('results-section');

// Chart instance
let comparisonChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSavedAmount();
    setupEventListeners();
    setupCardClickEffects();
});

// Setup event listeners
function setupEventListeners() {
    // Real-time calculation on input
    amountInput.addEventListener('input', function() {
        handleAmountInput();
        const value = parseFloat(this.value);
        if (value && value >= 100) {
            calculateInstallments();
        } else {
            hideResults();
        }
    });

    // Calculate button click
    calculateBtn.addEventListener('click', function() {
        if (validateInput()) {
            showLoadingState();
            setTimeout(() => {
                calculateInstallments();
                hideLoadingState();
            }, 500);
        }
    });

    // Clear button
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        clearInput();
    });

    // Enter key support
    amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (validateInput()) {
                calculateInstallments();
            }
        }
    });

    // Prevent non-numeric input
    amountInput.addEventListener('keypress', function(e) {
        // Allow backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    // Format input as user types
    amountInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d]/g, '');
        
        if (value) {
            // Store cursor position
            const cursorPosition = e.target.selectionStart;
            const oldLength = e.target.value.length;
            
            // Update value (keep it as number for calculations)
            e.target.value = value;
            
            // Restore cursor position accounting for any length changes
            const newLength = e.target.value.length;
            const newCursorPosition = cursorPosition + (newLength - oldLength);
            e.target.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    });
}

// Handle amount input formatting and validation
function handleAmountInput() {
    const value = amountInput.value;
    
    // Show/hide clear button
    if (value && value.trim() !== '') {
        clearBtn.classList.add('show');
    } else {
        clearBtn.classList.remove('show');
    }

    // Save amount to localStorage
    if (value && !isNaN(value)) {
        localStorage.setItem('lastAmount', value);
    }
}

// Validate input
function validateInput() {
    const amount = parseFloat(amountInput.value);
    
    // Remove any existing error messages
    removeErrorMessages();
    
    if (!amountInput.value || amountInput.value.trim() === '') {
        showError('يرجى إدخال المبلغ المطلوب');
        return false;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showError('يرجى إدخال مبلغ صحيح');
        return false;
    }
    
    if (amount < 100) {
        showError('المبلغ الأدنى هو 100 ريال سعودي');
        return false;
    }
    
    if (amount > 1000000) {
        showError('المبلغ الأقصى هو 1,000,000 ريال سعودي');
        return false;
    }
    
    return true;
}

// Calculate installments for all options
function calculateInstallments() {
    const principal = parseFloat(amountInput.value);
    
    if (!principal || principal < 100) return;
    
    const results = installmentOptions.map(option => {
        return calculateSingleInstallment(principal, option);
    });
    
    displayResults(results);
    updateChart(results);
    showResults();
}

// Calculate single installment option using SIMPLE interest formula
function calculateSingleInstallment(principal, option) {
    const { months, annual_rate, fees } = option;
    
    // Simple Interest Formula (FIXED):
    // Interest Amount = Principal × (Annual Rate / 100)
    // Total Amount = Principal + Interest Amount + Fees
    // Monthly Payment = Total Amount ÷ Number of Months
    
    const interestAmount = principal * (annual_rate / 100);
    const totalAmount = principal + interestAmount + fees;
    const monthlyPayment = totalAmount / months;
    
    // Round monthly payment to nearest whole number
    const roundedMonthlyPayment = Math.round(monthlyPayment);
    
    return {
        months,
        annual_rate,
        monthlyPayment: roundedMonthlyPayment,
        totalAmount: Math.round(totalAmount),
        totalInterest: Math.round(interestAmount + fees),
        principal: principal,
        fees: fees,
        interestOnly: Math.round(interestAmount)
    };
}

// Display calculation results
function displayResults(results) {
    results.forEach((result, index) => {
        const months = result.months;
        
        // Update total amount
        const totalElement = document.getElementById(`total-${months}`);
        if (totalElement) {
            totalElement.textContent = formatCurrency(result.totalAmount);
        }
        
        // Update monthly payment
        const monthlyElement = document.getElementById(`monthly-${months}`);
        if (monthlyElement) {
            monthlyElement.textContent = formatCurrency(result.monthlyPayment);
        }
        
        // Update interest (interest + fees)
        const interestElement = document.getElementById(`interest-${months}`);
        if (interestElement) {
            interestElement.textContent = formatCurrency(result.totalInterest);
        }
    });
}

// Update comparison chart
function updateChart(results) {
    const ctx = document.getElementById('comparison-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    const labels = results.map(r => `${r.months} شهر`);
    const monthlyPayments = results.map(r => r.monthlyPayment);
    const totalAmounts = results.map(r => r.totalAmount);
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'القسط الشهري (ر.س)',
                    data: monthlyPayments,
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false,
                },
                {
                    label: 'إجمالي المبلغ (ر.س)',
                    data: totalAmounts,
                    backgroundColor: '#FFC185',
                    borderColor: '#FFC185',
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'مقارنة خيارات التقسيط',
                    font: {
                        family: 'Tajawal',
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Tajawal',
                            size: 12
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    titleFont: {
                        family: 'Tajawal'
                    },
                    bodyFont: {
                        family: 'Tajawal'
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: 'Tajawal',
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Tajawal',
                            size: 12
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Format currency in Arabic locale
function formatCurrency(amount) {
    if (isNaN(amount)) return '0 ر.س';
    
    return new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount)) + ' ر.س';
}

// Show results section with animation
function showResults() {
    resultsSection.classList.remove('hidden');
    setTimeout(() => {
        resultsSection.classList.add('show');
    }, 10);
}

// Hide results section
function hideResults() {
    resultsSection.classList.remove('show');
    setTimeout(() => {
        resultsSection.classList.add('hidden');
    }, 300);
}

// Show error message
function showError(message) {
    removeErrorMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const inputSection = document.querySelector('.input-section');
    const calculateButton = document.querySelector('.calculate-btn');
    inputSection.insertBefore(errorDiv, calculateButton);
    
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeErrorMessages();
    }, 5000);
}

// Remove error messages
function removeErrorMessages() {
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => {
        error.remove();
    });
}

// Clear input
function clearInput() {
    amountInput.value = '';
    amountInput.focus();
    clearBtn.classList.remove('show');
    hideResults();
    removeErrorMessages();
    localStorage.removeItem('lastAmount');
}

// Load saved amount from localStorage
function loadSavedAmount() {
    const savedAmount = localStorage.getItem('lastAmount');
    if (savedAmount && !isNaN(savedAmount)) {
        amountInput.value = savedAmount;
        clearBtn.classList.add('show');
        
        // Auto calculate if amount is valid
        if (parseFloat(savedAmount) >= 100) {
            calculateInstallments();
        }
    }
}

// Add click effect to installment cards
function setupCardClickEffects() {
    const cards = document.querySelectorAll('.installment-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            cards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            this.classList.add('active');
            
            // Add some visual feedback
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Show loading state
function showLoadingState() {
    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحساب...';
    calculateBtn.classList.add('loading');
    calculateBtn.disabled = true;
}

// Hide loading state
function hideLoadingState() {
    calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> احسب الأقساط';
    calculateBtn.classList.remove('loading');
    calculateBtn.disabled = false;
}

// Test calculations for verification (can be called from console)
function testCalculations() {
    console.log('Testing calculations with 10,000 SAR:');
    installmentOptions.forEach(option => {
        const result = calculateSingleInstallment(10000, option);
        console.log(`${option.months} months:`, {
            total: result.totalAmount,
            monthly: result.monthlyPayment,
            interest: result.totalInterest,
            principal: result.principal,
            fees: result.fees
        });
    });
    
    // Expected results:
    console.log('\nExpected results:');
    console.log('6 months: Total 11,950, Monthly 1,992');
    console.log('12 months: Total 13,850, Monthly 1,154'); 
    console.log('18 months: Total 15,750, Monthly 875');
}

// Uncomment to test calculations
// testCalculations();