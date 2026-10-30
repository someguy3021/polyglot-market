package dev.polyglot.spring4.common;

/** Мета-блок пагинации контракта: { currentPage, lastPage, perPage, total }. */
public record PageMeta(int currentPage, int lastPage, int perPage, int total) {

    public static PageMeta of(int total, int page, int perPage) {
        int lastPage = Math.max(1, (int) Math.ceil((double) total / perPage));
        return new PageMeta(page, lastPage, perPage, total);
    }

    public static <T> PageResponse<T> response(java.util.List<T> data, int total, int page, int perPage) {
        return new PageResponse<>(data, of(total, page, perPage));
    }
}
