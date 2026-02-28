package com.tripify.travel.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @GetMapping("/{userId}")
    public ResponseEntity<String> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok("User profile for ID: " + userId);
    }

    @PutMapping("/{userId}/preferences")
    public ResponseEntity<String> updatePreferences(
            @PathVariable Long userId,
            @RequestBody String preferences) {

        return ResponseEntity.ok("Preferences updated for user: " + userId);
    }
}