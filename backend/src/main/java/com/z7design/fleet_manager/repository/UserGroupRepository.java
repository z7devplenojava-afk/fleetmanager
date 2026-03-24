package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.UserGroupEntity;
import com.z7design.fleet_manager.model.enums.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroupEntity, java.util.UUID> {
    
    Optional<UserGroupEntity> findByGroupName(UserGroup groupName);
    
    @Query("SELECT ug FROM UserGroupEntity ug JOIN ug.users u WHERE u.id = :userId")
    List<UserGroupEntity> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT ug FROM UserGroupEntity ug WHERE ug.groupName IN :groupNames")
    List<UserGroupEntity> findByGroupNames(@Param("groupNames") List<UserGroup> groupNames);
    
    boolean existsByGroupName(UserGroup groupName);

    @Override
    List<UserGroupEntity> findAll();
} 
