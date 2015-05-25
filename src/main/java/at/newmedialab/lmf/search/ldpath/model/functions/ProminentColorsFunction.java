/**
 * Copyright (C) 2013 Salzburg Research.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package at.newmedialab.lmf.search.ldpath.model.functions;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;

import javax.enterprise.context.ApplicationScoped;
import javax.imageio.ImageIO;
import javax.inject.Inject;

import org.apache.marmotta.kiwi.model.rdf.KiWiStringLiteral;
import org.apache.marmotta.ldpath.api.backend.RDFBackend;
import org.apache.marmotta.platform.core.api.content.ContentService;
import org.apache.marmotta.platform.ldpath.api.AutoRegisteredLDPathFunction;
import org.openrdf.model.Literal;
import org.openrdf.model.Resource;
import org.openrdf.model.Value;
import org.slf4j.Logger;

import at.newmedialab.lmf.search.util.LabColorSpace;

import com.google.common.base.Preconditions;

@ApplicationScoped
public class ProminentColorsFunction extends AutoRegisteredLDPathFunction {
    public static final Color BASE_COLORS[] = {
        Color.decode("#202020"), /* BLACK */
        Color.decode("#0087BD"), /* BLUE */
        Color.decode("#009F6B"), /* GREEN */
        Color.decode("#C40233"), /* RED */
        Color.decode("#FFD300"), /* YELLOW */
        Color.decode("#EEEEEE") /* WHITE */
    };

    @Inject
    private Logger            log;

    @Inject
    private ContentService contentService;

    @Override
    public Collection<Value> apply(RDFBackend<Value> backend, Value context, Collection<Value>... args) throws IllegalArgumentException {
        Preconditions.checkArgument(args.length == 0, "ProminentColorsFunction does not take arguments");

        if (!(context instanceof Literal)) {
            Resource rsc = (Resource) context;

            final String contentType = contentService.getContentType(rsc);
            if (contentType != null && contentType.startsWith("image/")) {
                try {
                    final BufferedImage img = ImageIO.read(contentService.getContentStream(rsc, contentType));
                    int total = 0, hist[] = new int[BASE_COLORS.length];
                    for (int x = 0; x < img.getWidth(); x++) {
                        for (int y = 0; y < img.getHeight(); y++) {
                            hist[getClosestColorIndex(img.getRGB(x, y))]++;
                            total++;
                        }
                    }
                    float th = total / (float) BASE_COLORS.length;
                    HashSet<Value> result = new HashSet<Value>();
                    for (int i = 0; i < hist.length; i++) {
                        if (hist[i] >= th) {
                            result.add(createResultLiteral(BASE_COLORS[i], hist[i] / (float) total));
                        }
                    }
                    return result;
                } catch (IOException e) {
                    log.warn("Could not load image content ({}) of {}", contentType, rsc);
                } catch(IllegalArgumentException ex) {
                    log.warn("Could not load image content ({}) of {}", contentType, rsc);
                }
            }
        }

        return Collections.emptySet();
    }

    protected KiWiStringLiteral createResultLiteral(final Color c, float boost) {
        return new KiWiStringLiteral(String.format("%d,%d,%d", c.getRed(), c.getGreen(), c.getBlue()));
    }

    protected int getClosestColorIndex(int color) {
        final Color c = new Color(color);
        float mDist = Float.MAX_VALUE;
        int index = 0;
        for (int i = 0; i < BASE_COLORS.length; i++) {
            float dist = distance(c, BASE_COLORS[i]);
            if (dist < mDist) {
                mDist = dist;
                index = i;
            }
        }
        return index;
    }

    protected float labDistance(Color c1, Color c2) {
        /*
         * X = 0.4124564 R + 0.3575761 G + 0.1804375 B
         * Y = 0.2126729 R + 0.7151522 G + 0.0721750 B
         * Z = 0.0193339 R + 0.1191920 G + 0.9503041 B
         */
        return 0f;
    }

    protected float distance(Color c1, Color c2) {
        // L1 metric (RGB)
        // return Math.abs(c1.getRed() - c2.getRed()) + Math.abs(c1.getGreen() - c2.getGreen()) +
        // Math.abs(c1.getBlue() - c2.getBlue());

        // L2 metric (RGB)
        // return Math.abs(c1.getRed() - c2.getRed()) ^ 2 + Math.abs(c1.getGreen() - c2.getGreen())
        // ^ 2 + Math.abs(c1.getBlue() - c2.getBlue()) ^ 2;

        // L2 metric (Lab)
        float[] cc1 = c1.getColorComponents(LabColorSpace.getInstance(), null);
        float[] cc2 = c2.getColorComponents(LabColorSpace.getInstance(), null);

        return (float) (Math.pow(cc1[0] - cc2[0], 2) + Math.pow(cc1[1] - cc2[1], 2) + Math.pow(cc1[2] - cc2[2], 2));
    }

    @Override
    public String getLocalName() {
        return "colors";
    }

    /**
     * A string describing the signature of this node function, e.g. "fn:content(uris : Nodes) : Nodes". The
     * syntax for representing the signature can be chosen by the implementer. This method is for informational
     * purposes only.
     *
     * @return
     */
    @Override
    public String getSignature() {
        return "fn:colors() : LiteralList";
    }

    /**
     * A short human-readable description of what the node function does.
     *
     * @return
     */
    @Override
    public String getDescription() {
        return "Return the prominent colors in the image represented by the context URI";
    }
}
