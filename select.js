$(document).ready(function () {
    $('#characterSelect').select2({
        placeholder: "好きなキャラを選んでね！",
        allowClear: true,
        closeOnSelect: false,
        tags: false
    });

    $('#characterSelect').on('select2:select', function () {
        setTimeout(() => {
            const selected = $(this).val();
            if (selected && selected.length > 2) {
                $(this).val(selected.slice(0, 2)).trigger('change');
                alert('選択できるのは2人までです！');
            }
        }, 0);
    });
});


