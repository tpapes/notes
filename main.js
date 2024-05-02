var pageCount = 1;
var pages = [document.getElementsByClassName("page")[0]];
var iRuleCount;

document.body.innerHTML += "<b><i><p id=\"scroll-message\" style=\"text-align:center;\">(scroll horizontally)</p></i></b>";
document.getElementById("content").addEventListener("scroll", scrollListener = (e)=>{
    var scrollMessage = document.getElementById("scroll-message");
    scrollMessage.remove();
    document.getElementById("content").removeEventListener("scroll", scrollListener);
    
});

//handles internal link logic
const onInternalLinkPressed = function(e){
    var link = e.data;
    var pageNum = link.dataset.pageNum;

    //backtrack if link is on a prev page
    if (parseInt(pageNum) < pageCount){

        backTrack(parseInt(pageNum));
        reviveLinks(pageNum);
        var listener = function(){
            //open new page
            var page = loadNewPage(link);
            updatePageCount(page);
            openNewPage();
            this.removeEventListener("closed", listener);
        };
        this.addEventListener("closed", listener)
    
    }else{
        //open new page
        var page = loadNewPage(link);
        updatePageCount(page);
        openNewPage();
    };
        

};

//creates and returns Page object made from linked HTML 
const loadNewPage = function(link){
//new section for the page to be shown in
    var newSection = document.createElement("section");

    //kill the link so user cant spawn duplicate pages
    killLink(link);

    //store page URL as newPageHref
    var newPageHref = link.getAttribute("href");

    var newTitle;
    var classes = [];

    //use url to get info from newPage's html file
    fetch(newPageHref)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            doc.querySelectorAll("a.internal").forEach(function(el){
                updateLinkPageNum(el);
            });

            //get content from html and add to page
            const contentEl = doc.getElementById("content")
            newSection.innerHTML = contentEl.innerHTML;

            //update classes with classes from new page
            classes = contentEl.classList;
            classEvent = new Event("classes loaded");
            classEvent.data = classes;
            newSection.dispatchEvent(classEvent);

            //update website title with title from new page
            const titleEl = doc.getElementsByTagName("title");
            newTitle = titleEl[0].textContent;
            setTitle(newTitle); 

        })
        .catch(error => {
            console.error("Error loading entry: ", error);
        });
    
    //make new Page object
    var newId = "page-" + (pages.length + 1);
    var page = new Page(newSection, pages.length + 1, newId, newTitle);

    //update classes once loaded
    newSection.addEventListener("classes loaded", updateClasses = (e) =>{
        e.data.forEach((c)=>{
            newSection.classList.add(c);
        })
        newSection.removeEventListener("classes loaded", updateClasses);
    })
    return page
};

const addAnimationToTarget = function(action, element){
    var animTime;
    if (action === "close"){animTime = ".15s"}else{animTime = ".25s"}
    element.style.animation = animTime + " ease 1 normal " + action;
    element.style.position = "relative"
    element.addEventListener("animationend", onAnimEnd);
};

//animate newly opened/closed pages.
const animatePages = (action, page) => {
    //load CSS rules
    var ruleSheet = document.styleSheets[0]
    var rules = ruleSheet.cssRules;
    iRuleCount = rules.length

    if (action === "open"){
        page.type = "Page"
        var newSection = page.section;

        ruleSheet.insertRule(`
            @keyframes open{
                from{
                    top: 100vh;
                }
                to{
                    top: 0vh; 
                }
            }
        `, iRuleCount);

        newSection.classList.add("loaded", "page");

        addAnimationToTarget(action, newSection);

    } else if (action === "close") {
        page.type = "Array/Page";
        ruleSheet.insertRule(`
            @keyframes close{
                from{
                    left: 0vw; 
                }
                to{
                    left: 100vw; 
                }
            }
        `, iRuleCount);

        page.forEach(function(target){
            addAnimationToTarget("close", target.section);
        });

    };
    document.styleSheets[0].cssRules = ruleSheet.cssRules;
};

//updates pages to reflect changes made by animation
//e.g. closes closed pages and sets width of open ones
const onAnimEnd = function(e){
    if (document.styleSheets[0][iRuleCount]){
        document.styleSheets[0].deleteRule(iRuleCount);
    };
    e.target.style.animation = "";
    e.target.removeEventListener("animationend", onAnimEnd);
    if (e.target.classList.contains("closing")){
        e.target.remove();
        var event = new Event("closed");
        dispatchEvent(event);
        
    };
    e.target.style.animation = "";
    e.target.removeEventListener("animationend", onAnimEnd);
};

const openNewPage = function(){
    var newPage = pages[pageCount - 1];
    animatePages("open", newPage);
    var container = document.getElementById("container");
    container.appendChild(newPage.section);
};

//sets site title
const setTitle = function(newTitle){
    document.title = newTitle;
}

//updates the PageCount var to match pages.length
const updatePageCount = function(newSection) {
   if (newSection){ 
        pageCount = pages.push(newSection);
   }else{
        pageCount = pages.length; 
   };
};

//assigns a page/section number to a link, based on curr pageCount
const updateLinkPageNum = function(link) {
    link.dataset.pageNum = pageCount;
};

//connect internal links in doc to onInternalLinkPressed() 
const connectInternalLinks = function() {
    var links = document.querySelectorAll("a.internal.live")
    links.forEach((link) =>{
        link.dataset.pageNum = "1";
    });

    document.addEventListener("click", function(e){
        if(e.target.matches("a.internal.live")) {
            e.preventDefault();
            e.data = e.target;
            onInternalLinkPressed(e);
        } else if (e.target.matches("a.internal.live i") | e.target.matches("a.internal.live b")){
            e.preventDefault();
            var parEl = e.target.parentElement;
            e.data = parEl;
            onInternalLinkPressed(e);
            
        }else if(e.target.matches("a.internal") | e.target.parentElement.matches("a.internal")){
            e.preventDefault();
        };
    });
};

//kills link
const killLink = function(link) {
    link.classList.remove("live");
};

//reviveLinks
const reviveLinks = function(pageNum){
    document.querySelectorAll("a[data-page-num=\"" + pageNum + "\"").forEach(
        function(link){
            link.classList.add("live");
        }
    );
};

//deletes latest page until pageCount = pageNum
const backTrack = function(pageNum){
    var removedPages = [];
    while(pageCount > pageNum){
        lastPage = pages.pop();
        lastPage.section.classList.add("closing");
        removedPages.push(lastPage);
        updatePageCount();
    };

    animatePages("close", removedPages);
};