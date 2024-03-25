

function scroll(divid){
$(document).ready(function () {
    target_offset = $(divid).offset(),
    target_top = target_offset.top;
    $('html, body').animate({
        scrollTop: target_top
    }, 800);
});
}