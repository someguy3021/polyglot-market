package dev.polyglot.spring4.seller;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Component;

/** Превью 320×240 «inside» → PNG (паритет sharp.resize(320,240,{fit:inside}).png()). */
@Component
public class ImageThumbs {

    private static final int MAX_W = 320;
    private static final int MAX_H = 240;

    public byte[] thumbnail(byte[] source) {
        BufferedImage img;
        try {
            img = ImageIO.read(new ByteArrayInputStream(source));
        } catch (IOException e) {
            img = null;
        }
        if (img == null) {
            throw new IllegalArgumentException("unsupported image format");
        }
        int w = img.getWidth();
        int h = img.getHeight();
        double scale = Math.min((double) MAX_W / w, (double) MAX_H / h);
        if (scale > 1) {
            scale = 1; // fit=inside только уменьшает
        }
        int tw = Math.max(1, (int) Math.round(w * scale));
        int th = Math.max(1, (int) Math.round(h * scale));
        BufferedImage thumb = new BufferedImage(tw, th, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = thumb.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(img, 0, 0, tw, th, null);
        } finally {
            g.dispose();
        }
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(thumb, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("thumbnail encoding failed", e);
        }
    }
}
