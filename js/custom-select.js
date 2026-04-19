/**
 * Custom multi-select dropdown for course checkboxes on the contact form.
 */
export function initCustomSelect() {
    const customSelect = document.getElementById('customSelect');
    const customSelectTrigger = customSelect?.querySelector('.custom-select-trigger');
    const customSelectOptions = document.getElementById('customSelectOptions');
    const customSelectValue = customSelect?.querySelector('.custom-select-value');
    const checkboxes = customSelectOptions?.querySelectorAll('input[type="checkbox"]');

    if (!customSelect || !customSelectTrigger || !customSelectOptions || !checkboxes?.length) return;

    customSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('active');
    });

    const updateDisplayValue = () => {
        const checked = Array.from(checkboxes).filter((cb) => cb.checked);
        if (checked.length === 0) customSelectValue.textContent = 'Select Course Interest';
        else if (checked.length === 1) customSelectValue.textContent = checked[0].getAttribute('data-label');
        else customSelectValue.textContent = `${checked.length} courses selected`;
    };

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', updateDisplayValue);
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) customSelect.classList.remove('active');
    });

    customSelectOptions.addEventListener('click', (e) => e.stopPropagation());

    updateDisplayValue();
}
