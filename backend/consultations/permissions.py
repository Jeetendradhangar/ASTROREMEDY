from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsAstrologer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_astrologer or request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and (request.user.is_astrologer or request.user.is_staff)
