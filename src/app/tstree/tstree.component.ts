import { Component, OnInit, Input, ElementRef, ViewEncapsulation, HostListener } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'tstree',
    templateUrl: './tstree.component.html',
    styleUrls: ['./tstree.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TsTreeComponent implements OnInit {

    @Input() data: number[];
    @Input() nodeHeight: number;

    private host: HTMLElement;
    private hostUl: HTMLUListElement;

    constructor(private el: ElementRef) {
        this.nodeHeight = 24;
    }

    ngOnInit() {
        // this.host = <HTMLElement>this.el.nativeElement;
        this.host = <HTMLDivElement>(document.getElementsByClassName('tstree-container')[0]);
        this.hostUl = document.createElement('ul');
        this.hostUl.classList.add('tstree-root');
        this.host.appendChild(this.hostUl);
        // this.loadData(this.data);
        this.refresh(this.data);
    }

    private loadData(data: number[]) {
        const listHeight = data.length * this.nodeHeight;
        // clientHeight = height + padding
        // offsetHeight = height + padding + border
        const hostHeight = this.host.clientHeight;

        const maxDisplayCount = (hostHeight / this.nodeHeight) + 1;  // + 1 cause of possible half item on top and bottom

        const ul = document.createElement('ul');
        ul.classList.add('tstree-root');
        ul.style.height = listHeight + 'px';


        for (let i = 0; i < maxDisplayCount; i++) {
            const li = document.createElement('li');
            li.classList.add('tstree-node');
            li.innerText = data[i] + '';
            ul.appendChild(li);
        }

        const bottomLi = document.createElement('li');
        bottomLi.classList.add('tstree-node');
        bottomLi.innerText = 'bottom';
        bottomLi.style.height = listHeight - (maxDisplayCount * this.nodeHeight) + 'px';
        ul.appendChild(bottomLi);

        this.host.appendChild(ul);
    }


    private refresh(data: number[]) {
        const listHeight = data.length * this.nodeHeight;
        const hostHeight = this.host.clientHeight;
        const maxDisplayCount = Math.ceil((hostHeight / this.nodeHeight) + 1);  // + 1 cause of possible half item on top and bottom

        const scrollTop = this.host.scrollTop;

        const topElements = Math.min(Math.floor(scrollTop / this.nodeHeight), data.length - maxDisplayCount);
        const topHeight = topElements * this.nodeHeight;

        const bottomElements = data.length - topElements - maxDisplayCount;
        const bottomHeight = bottomElements * this.nodeHeight;

        const ul = document.createElement('ul');
        // ul.classList.add('tstree-root');
        // ul.style.height = listHeight + 'px';

        if (topHeight > 0) {
            const topLi = document.createElement('li');
            topLi.classList.add('tstree-node');
            topLi.innerText = 'top';
            topLi.style.height = topHeight + 'px';
            ul.appendChild(topLi);
        }

        for (let i = topElements; i < maxDisplayCount + topElements; i++) {
            const li = document.createElement('li');
            li.classList.add('tstree-node');
            li.innerText = data[i] + '';
            ul.appendChild(li);
        }

        if (bottomHeight > 0) {
            const bottomLi = document.createElement('li');
            bottomLi.classList.add('tstree-node');
            bottomLi.innerText = 'bottom';
            bottomLi.style.height = bottomHeight + 'px';
            ul.appendChild(bottomLi);
        }

        this.hostUl.innerHTML = ul.innerHTML;
    }

    public onScroll(e: UIEvent) {
        const eventTarget = <HTMLElement>e.target;
        const scrollTop = eventTarget.scrollTop;

        const notDisplayedElementsTop = scrollTop / this.nodeHeight;
        this.refresh(this.data);

        e.preventDefault();
    }
}
