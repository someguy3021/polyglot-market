package dev.polyglot.spring27.common;

import java.util.List;

/** Конверт списка контракта: { data, meta }. */
public class PageResponse<T> {

    public final List<T> data;
    public final PageMeta meta;

    public PageResponse(List<T> data, PageMeta meta) {
        this.data = data;
        this.meta = meta;
    }
}
