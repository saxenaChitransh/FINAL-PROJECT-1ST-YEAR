document.addEventListener("DOMContentLoaded", function () {
    var searchForm = document.querySelector(".home-search");
    var searchInput = document.querySelector(".home-search input");

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var query = searchInput.value.trim();
        var target = "index-with-js.html";

        if (query) {
            target += "?search=" + encodeURIComponent(query);
        }

        window.location.href = target;
    });
});
