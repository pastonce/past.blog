箭头运算符`->`也叫做类成员访问运算符，相当于**对类对象指针解引用并调用成员**，如下：

```c++
#include <iostream>

class Entity {
public:
    int x;
public:
    void Print() const { std::cout << "Hello!" << std::endl; }
};

int main() {
    Entity e;
    e.Print(); // Hello!
    
    Entity* ptr = &e;
    (*ptr).Print(); // Hello!
    ptr->Print(); // Hello!
    ptr->x = 2;
}
```

也可以通过对箭头运算符进行重载，实现不改变代码使用形式但可以封装一些其他操作（如超出作用域自动释放内存）的功能，即**智能指针**（详见[[C++自学 14] | C++智能指针](https://past-blog.vercel.app/blog/smart-pointer)）如下：

```c++
class Entity;

class ScopedPtr {
private:
    Entity* m_Obj;
public:
    ScopedPtr(Entity* entity)
        : m_Obj(entity)
        {}
    ~ScopedPtr() {
        delete m_Obj;
    }
    
    Entity* operator->() {
        return m_Obj;
    }
    const Entity* operator->() const { // const ScopedPtr 版本
        return m_Obj;
    }
};

int main() {
    // Entity* entity = new Entity();
    ScopedPtr entity = new Entity();
    
    // const Entity* entity = new Entity();
    // const ScopedPtr entity = new Entity();
    entity->Print(); // Hello!
}
```

* 使用或者重载`->`运算符时，返回类型必须是指针或者类的对象

* 特别地，上述代码中`entity->Print()`会被解释为**`(entity.operator->())->Print()`**

    另外，也可以借助箭头运算符获取对象成员在内存地址中的偏移量

```c++
#include <iostream>
#include <cstdint>

struct Vector3 {
    float x, y, z;
};

int main() {
    // 使用 uintptr_t 保留 64 位地址精度
    std::uintptr_t offset = reinterpret_cast<std::uintptr_t>(&((Vector3*)nullptr)->y);
    std::cout << offset << std::endl; // 4
}
```

* 个人理解：`nullptr`的起始地址为`0`，将其强制类型转换为`Vector3*`格式并取成员变量的地址后，得到的`offset`即为相对于起始地址`0`的偏移量
* 当数据被序列化为一串字节流时，可以借助此种方法计算一些变量的偏移量