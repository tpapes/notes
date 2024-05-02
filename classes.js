class Page {
    constructor(section, pageNum, id, title){
        this.section = section;
        this.pageNum = pageNum;
        this.section.id = id;
        this.section.title = title;
        this.section.classList.add("page");
        this.section.page = this;

    };

};