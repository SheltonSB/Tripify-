package com.tripify.travel.repository;

import com.tripify.travel.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}