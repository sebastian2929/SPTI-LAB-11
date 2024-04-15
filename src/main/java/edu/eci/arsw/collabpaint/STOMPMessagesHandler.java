package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class STOMPMessagesHandler {

    private Map<String, ArrayList<Point>> points = new ConcurrentHashMap<>();
    SimpMessagingTemplate msgt;

    @Autowired
    public void SimpMessagingTemplateService(SimpMessagingTemplate simpMessagingTemplate) {
        this.msgt = simpMessagingTemplate;
    }

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws InvalidPointEventException {
        msgt.convertAndSend("/topic/newpoint."+numdibujo, pt);
        if (points.get(numdibujo) != null){
            points.get(numdibujo).add(pt);
            if (points.get(numdibujo).size() % 4 == 0){
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, points.get(numdibujo));
            }
        } else {
            ArrayList<Point> nuevo = new ArrayList<>();
            nuevo.add(pt);
            points.put(numdibujo, nuevo);
        }
        
        if (pt == null || numdibujo == null || numdibujo.isEmpty()) {
            throw new InvalidPointEventException("Invalid point event: Either point or numdibujo is null or empty.");
        }
    }
}
