package dev.polyglot.spring27.common;

/** Мета-блок пагинации контракта: { currentPage, lastPage, perPage, total }. */
public class PageMeta {

    public final int currentPage;
    public final int lastPage;
    public final int perPage;
    public final int total;

    public PageMeta(int currentPage, int lastPage, int perPage, int total) {
        this.currentPage = currentPage;
        this.lastPage = lastPage;
        this.perPage = perPage;
        this.total = total;
    }

    public static PageMeta of(int total, int page, int perPage) {
        int lastPage = Math.max(1, (int) Math.ceil((double) total / perPage));
        return new PageMeta(page, lastPage, perPage, total);
    }
}
